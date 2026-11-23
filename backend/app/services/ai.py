"""Gemini 연동(키가 있을 때) + 키가 없을 때 동작하는 규칙 기반 폴백."""
import json
import re
from collections.abc import Iterator

import httpx

from ..config import settings
from .catalog_data import ALIASES

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:{method}"


def gemini_enabled() -> bool:
    return bool(settings.gemini_api_key)


def _payload(prompt: str, json_mode: bool = False) -> dict:
    body: dict = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
    if json_mode:
        body["generationConfig"] = {"responseMimeType": "application/json"}
    return body


def gemini_text(prompt: str, json_mode: bool = False) -> str:
    url = GEMINI_URL.format(model=settings.gemini_model, method="generateContent")
    r = httpx.post(url, params={"key": settings.gemini_api_key}, json=_payload(prompt, json_mode), timeout=30)
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def gemini_stream(prompt: str) -> Iterator[str]:
    url = GEMINI_URL.format(model=settings.gemini_model, method="streamGenerateContent")
    with httpx.stream("POST", url, params={"key": settings.gemini_api_key, "alt": "sse"}, json=_payload(prompt), timeout=60) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if line.startswith("data:"):
                try:
                    yield json.loads(line[5:])["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError, json.JSONDecodeError):
                    continue


def extract_skills(text: str) -> list[str]:
    low = text.lower() + " "
    return [s for s, aliases in ALIASES.items() if any(a in low for a in aliases)]


def structure_requirements(job: str, text: str) -> dict:
    """기업 담당자의 자유 서술 요건을 {필수, 우대, 경력, 학습 과정 제안} 구조로 변환."""
    if gemini_enabled():
        try:
            prompt = ("다음 채용 요건을 JSON으로 구조화하라. 키: must(필수 역량 배열), nice(우대 역량 배열), "
                      "experience(문자열), summary(한 줄 요약). 역량명은 한국어/영문 기술명으로 간결하게.\n"
                      f"직무: {job}\n요건: {text}")
            data = json.loads(gemini_text(prompt, json_mode=True))
            return {**data, "engine": "gemini"}
        except Exception:  # noqa: BLE001 - 외부 API 실패 시 규칙 기반으로 대체
            pass
    clauses = re.split(r"[\n,;.]", text)
    nice = extract_skills(" ".join(c for c in clauses if "우대" in c))
    must = [s for s in extract_skills(text) if s not in nice]
    exp = re.search(r"(신입|경력\s*\d+\s*년\s*이상|\d+\s*년\s*이상)", text)
    return {"must": must, "nice": nice, "experience": exp.group(1) if exp else "무관",
            "summary": f"{job} 직무: 필수 {len(must)}개, 우대 {len(nice)}개 역량 도출", "engine": "rule-based"}


def tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[A-Za-z0-9+#/]+|[가-힣]{2,}", text.lower()) if len(t) > 1}


def answer_stream(question: str, sources: list[dict]) -> Iterator[str]:
    ctx = "\n".join(f"- {s['title']} ({', '.join(s['skills'])}): {s['summary']} / 커리큘럼: {' > '.join(s['curriculum'])}" for s in sources)
    if gemini_enabled():
        prompt = ("너는 학습 플랫폼 cognipick의 AI 튜터다. 아래 참고 강의 콘텐츠를 근거로 한국어로 간결하게 답하라. "
                  f"참고 강의:\n{ctx}\n\n질문: {question}")
        try:
            yield from gemini_stream(prompt)
            return
        except Exception:  # noqa: BLE001
            pass
    if not sources:
        text = "질문과 직접 관련된 강의를 찾지 못했어요. 'SQL', 'LLM', 'Docker'처럼 역량 키워드를 포함해 다시 질문해 주세요."
    else:
        top = sources[0]
        steps = "\n".join(f"{i}. {c}" for i, c in enumerate(top["curriculum"], 1))
        text = (f"질문하신 내용은 **{top['title']}** 과정의 핵심 주제와 맞닿아 있어요.\n\n"
                f"이 과정은 아래 순서로 학습하면 효율적입니다.\n{steps}\n\n"
                f"기업 채용공고에서도 {', '.join(top['skills'])} 역량이 반복적으로 요구됩니다. "
                "아래 참고 콘텐츠에서 이어서 학습해 보세요.")
    for i in range(0, len(text), 6):
        yield text[i:i + 6]
