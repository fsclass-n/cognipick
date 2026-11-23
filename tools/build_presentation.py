"""cognipick 발표자료(.pptx) + 발표 대본(docs/presentation.md) 생성기.

실행(저장소 루트):  .venv/Scripts/python tools/build_presentation.py
의존성: tools/requirements.txt (python-pptx, segno, Pillow)
스크린샷은 docs/assets/*.png 를 사용한다 (Playwright 로 로컬 앱을 캡처한 실제 화면).
"""
from __future__ import annotations

import io
from pathlib import Path

import segno
from PIL import Image, ImageDraw, ImageFilter
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
OUT_PPTX = ROOT / "docs" / "cognipick_발표자료.pptx"
OUT_MD = ROOT / "docs" / "presentation.md"

INK, BRAND, MINT, BG = "0B0E2C", "4A3AFF", "20D6A5", "F4F5FB"
MUTED, LINE, WHITE, AMBER, ROSE = "626786", "E2E5F2", "FFFFFF", "F59E0B", "EC4899"
FONT = "맑은 고딕"
REPO = "https://github.com/fsclass-n/cognipick"
SITE = "https://cognipick.onrender.com"
TOTAL = 16
SECTIONS = ["표지", "배경", "솔루션", "아키텍처", "기술 선택", "데이터 파이프라인", "분석 로직", "인증·보안", "유저 플로우",
            "반응형 UI", "관리자", "DevOps", "트러블슈팅", "산출물", "회고", "Q&A"]


def rgb(h: str) -> RGBColor:
    return RGBColor.from_string(h)


# ───────────────────────── 배경/이미지 유틸 ─────────────────────────
def make_bg(dark: bool) -> io.BytesIO:
    W, H = 1920, 1080
    base = Image.new("RGB", (W, H), "#" + (INK if dark else BG))
    glow = Image.new("RGB", (W, H), "#" + (INK if dark else BG))
    d = ImageDraw.Draw(glow)
    d.ellipse((1250, -350, 2350, 650), fill="#" + ("3A2BD6" if dark else "C7C1FF"))
    d.ellipse((-450, 650, 550, 1450), fill="#" + ("0B8F73" if dark else "BFF3E3"))
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    base = Image.blend(base, glow, 0.55 if dark else 0.7)
    d = ImageDraw.Draw(base)
    dot = "#" + ("2A2F63" if dark else "D5D8EF")
    for x in range(30, W, 44):
        for y in range(30, H, 44):
            d.ellipse((x - 1.6, y - 1.6, x + 1.6, y + 1.6), fill=dot)
    buf = io.BytesIO()
    base.save(buf, "JPEG", quality=86)
    buf.seek(0)
    return buf


def crop_to(path: Path, aspect: float, top: float = 0.0, left: float = 0.5) -> io.BytesIO:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if w / h > aspect:
        nw = int(h * aspect)
        x0 = int((w - nw) * left)
        im = im.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(w / aspect)
        y0 = int((h - nh) * top)
        im = im.crop((0, y0, w, y0 + nh))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=88)
    buf.seek(0)
    return buf


def qr_png(url: str) -> io.BytesIO:
    buf = io.BytesIO()
    segno.make(url, error="m").save(buf, kind="png", scale=12, border=1, dark="#" + INK, light="#FFFFFF")
    buf.seek(0)
    return buf


# ───────────────────────── 도형/텍스트 헬퍼 ─────────────────────────
def shape(sl, kind, x, y, w, h, fill=None, line=None, lw=1.0, radius=None, dash=False):
    s = sl.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius is not None and kind == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    if fill:
        s.fill.solid()
        s.fill.fore_color.rgb = rgb(fill)
    else:
        s.fill.background()
    if line:
        s.line.color.rgb = rgb(line)
        s.line.width = Pt(lw)
        if dash:
            s.line.dash_style = 4  # MSO_LINE.DASH
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    return s


def card(sl, x, y, w, h, fill=WHITE, line=LINE, radius=0.06, **kw):
    return shape(sl, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, fill, line, radius=radius, **kw)


def text(sl, x, y, w, h, content, size=14, color=INK, bold=False, align="l", anchor="t", spacing=1.15, space_after=0):
    """content: str | list[str | list[(txt, {opts})]]  — 리스트의 각 항목이 문단."""
    tb = sl.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    paras = content if isinstance(content, list) else [content]
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        p.line_spacing = spacing
        p.space_after = Pt(space_after)
        runs = para if isinstance(para, list) else [(para, {})]
        for t, o in runs:
            r = p.add_run()
            r.text = t
            f = r.font
            f.name = o.get("font", FONT)
            f.size = Pt(o.get("size", size))
            f.bold = o.get("bold", bold)
            f.color.rgb = rgb(o.get("color", color))
    return tb


def pill(sl, x, y, w, h, label, fill=BRAND, color=WHITE, size=11, bold=True):
    s = shape(sl, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, fill, radius=0.5)
    tf = s.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name, r.font.size, r.font.bold = FONT, Pt(size), bold
    r.font.color.rgb = rgb(color)
    return s


def picture(sl, buf, x, y, w=None, h=None):
    return sl.shapes.add_picture(buf, Inches(x), Inches(y), Inches(w) if w else None, Inches(h) if h else None)


def browser(sl, name, x, y, w, aspect=1.6, top=0.0, left=0.5, label=None, dark=False):
    """브라우저 창 프레임 + 스크린샷. 반환: 전체 높이."""
    bar, pad = 0.3, 0.05
    ph = (w - 2 * pad) / aspect
    total = bar + ph + pad
    card(sl, x, y, w, total, fill="1B1F4A" if dark else WHITE, line="3A3F7A" if dark else LINE, radius=0.03)
    for i, c in enumerate(["FF5F57", "FEBC2E", "28C840"]):
        shape(sl, MSO_SHAPE.OVAL, x + 0.14 + i * 0.17, y + 0.1, 0.1, 0.1, c)
    if label:
        text(sl, x + 0.75, y + 0.065, w - 1.0, 0.2, label, 9, "9AA0C8" if dark else MUTED)
    picture(sl, crop_to(ASSETS / f"{name}.png", aspect, top, left), x + pad, y + bar, w - 2 * pad, ph)
    return total


def phone(sl, name, x, y, h, top=0.0):
    w = h * 0.47
    shape(sl, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, INK, radius=0.11)
    inner_w, inner_h = w - 0.16, h - 0.16
    picture(sl, crop_to(ASSETS / f"{name}.png", inner_w / inner_h, top), x + 0.08, y + 0.08, inner_w, inner_h)
    return w


def header(sl, no, title, dark=False, sub=None):
    fg = WHITE if dark else INK
    text(sl, 0.6, 0.42, 6, 0.3, [[(f"{no:02d}", {"color": MINT if dark else BRAND, "bold": True}), (f"   {SECTIONS[no - 1].upper()}", {"color": "9AA0C8" if dark else MUTED})]], 11, bold=True)
    text(sl, 0.6, 0.78, 12.1, 0.8, title, 28, fg, True, spacing=1.05)
    if sub:
        text(sl, 0.6, 1.48, 12, 0.35, sub, 13, "B8BDE0" if dark else MUTED)


def footer(sl, no, owner, dark=False):
    muted = "7F86B8" if dark else MUTED
    text(sl, 0.6, 6.72, 8, 0.25, f"담당  {owner}", 10, muted)
    text(sl, 9.2, 6.72, 3.53, 0.25, f"cognipick  ·  {no} / {TOTAL}", 10, muted, align="r")
    x0, x1, y = 0.6, 12.73, 7.12
    shape(sl, MSO_SHAPE.RECTANGLE, x0, y - 0.015, x1 - x0, 0.03, "3A3F7A" if dark else "C9CDEB")
    step = (x1 - x0) / (TOTAL - 1)
    done = shape(sl, MSO_SHAPE.RECTANGLE, x0, y - 0.015, step * (no - 1), 0.03, MINT if dark else BRAND)
    for i in range(TOTAL):
        cx = x0 + step * i
        if i + 1 == no:
            shape(sl, MSO_SHAPE.OVAL, cx - 0.1, y - 0.1, 0.2, 0.2, MINT, "0B0E2C" if dark else WHITE, 2)
        else:
            shape(sl, MSO_SHAPE.OVAL, cx - 0.05, y - 0.05, 0.1, 0.1, (MINT if dark else BRAND) if i + 1 < no else ("3A3F7A" if dark else "C9CDEB"))
    return done


def bullets(sl, x, y, w, items, size=14, color=INK, gap=7, dot=BRAND, h=4.5):
    """items: str 또는 (굵은 머리말, 설명)"""
    paras = []
    for it in items:
        if isinstance(it, tuple):
            paras.append([("●  ", {"color": dot, "size": size - 4}), (it[0], {"bold": True}), (f"  {it[1]}", {"color": color})])
        else:
            paras.append([("●  ", {"color": dot, "size": size - 4}), (it, {})])
    return text(sl, x, y, w, h, paras, size, color, spacing=1.2, space_after=gap)


def code(sl, x, y, w, h, lines, size=12):
    card(sl, x, y, w, h, fill="12163F", line="2A2F63", radius=0.04)
    text(sl, x + 0.22, y + 0.16, w - 0.44, h - 0.3, lines, size, "DDE1FF", spacing=1.25, space_after=3)


# ───────────────────────── 슬라이드 데이터 ─────────────────────────
# script: 발표자(김모란) 구어체 대본 / appeal: 면접관에게 어필할 포인트 / sec: 목표 발표 시간(초)
D = {
    1: dict(title="표지", sec=40, visual="다크 배경 + 브랜드 로고 + QR 2개(저장소·라이브 데모)",
            body=["cognipick — 기업이 찾는 역량을 데이터로 Pick", "AI 지능형 학습 플랫폼 & 기업 수요 분석 비즈니스 플랫폼", "발표 김모란 · 팀 김모란(조장)·박미금·이오리·홍기흥"],
            script="안녕하세요, cognipick 팀의 발표를 맡은 김모란입니다. 저희는 기업이 채용에서 실제로 요구하는 역량을 데이터로 읽고, 학습자의 역량과 맞붙여서 지금 가장 먼저 배워야 할 강의를 골라주는 학습 플랫폼을 만들었습니다. 오늘은 4명이 역할을 나눠 만든 풀스택 구조와, 배포 과정에서 직접 부딪힌 문제를 어떻게 풀었는지를 중심으로 20분 동안 말씀드리겠습니다. 오른쪽 QR로 라이브 사이트와 저장소에 바로 들어가실 수 있습니다.",
            appeal="첫 30초에 한 줄 가치와 라이브 링크를 제시해 '실제로 동작하는 서비스'임을 각인"),
    2: dict(title="왜 만들었나: 학습과 채용 사이의 단절", sec=70, visual="문제 3카드 → 해결 흐름(수요 분석→진단→갭→Pick)",
            body=["학습자: 무엇을 배워야 취업에 유리한지 알 수 없음", "기업 수요 데이터: 채용공고·공공 고용 통계·AI Hub로 파편화", "학습 운영: 진도·추천 성과를 감으로 판단", "해결: 수요 분석 → 역량 진단 → 갭 → 맞춤 Pick → 운영 지표"],
            script="출발점은 학습과 채용이 따로 논다는 문제의식이었습니다. 학습자는 어떤 기술을 배워야 하는지 몰라서 인기 강의를 따라가고, 기업 수요 데이터는 채용공고, 고용24, AI Hub처럼 여기저기 흩어져 있습니다. 운영하는 쪽도 추천이 실제로 수강으로 이어지는지 숫자로 보기 어렵습니다. 그래서 저희는 수요를 분석하고, 내 역량을 진단하고, 그 사이의 갭을 계산해 강의를 추천하고, 그 성과를 다시 운영 지표로 돌려보는 하나의 순환 구조로 풀었습니다.",
            appeal="기능이 아니라 '문제 정의 → 순환 구조'로 시작하는 기획력"),
    3: dict(title="솔루션: 세 가지 핵심 기능 + 운영 시스템", sec=70, visual="3열 카드(01 수요 분석 / 02 AI 진단 / 03 맞춤 Pick) + 하단 운영 띠",
            body=["01 기업 수요 분석: 직무·산업·지역 필터, 워드클라우드, 12개월 시계열, 기업 수요 등록→AI 구조화", "02 AI 역량 진단: 직무별 문항, 역량 레이더, 기업 요구 대비 Gap", "03 맞춤 학습 Pick: 매칭률, 3단계 로드맵, AI 튜터(스트리밍·출처 표기)", "운영: 회원·권한, 콘텐츠·태그, 모니터링 대시보드"],
            script="핵심 기능은 세 가지입니다. 첫째, 기업 수요 분석입니다. 직무, 산업, 지역으로 걸러서 어떤 역량이 뜨고 있는지 보고, 기업 담당자가 채용 요건을 글로 쓰면 AI가 필수와 우대로 구조화합니다. 둘째, AI 역량 진단입니다. 결과는 레이더 차트와 기업 요구 수준 대비 갭으로 보여드립니다. 셋째, 갭을 가장 효율적으로 줄이는 강의와 3단계 로드맵을 추천하는 맞춤 Pick입니다. 그리고 이 모든 것을 운영하는 관리자 시스템까지 하나의 플랫폼으로 묶었습니다.",
            appeal="B2C(학습자) + B2B(기업) + 운영(관리자) 3축을 한 제품으로 설계"),
    4: dict(title="전체 시스템 아키텍처", sec=90, visual="좌→우 3단 구성도: Client / API / Data·외부 서비스 + 하단 CI/CD 흐름",
            body=["Client: React 19 + Vite + Tailwind v4 (Netlify 데모 · Render Static)", "API: FastAPI (Docker, Render Web Service) — Auth/Demand/Diagnosis·Recommend/Tutor(SSE)/Admin", "Data: TiDB Cloud(MySQL 호환, TLS) · 로컬·테스트는 SQLite 폴백", "External: Gemini(선택, 규칙 기반 폴백) · OAuth(Google/Naver/Kakao)", "CI/CD: GitHub Actions → 경로 감지 → 테스트·빌드 → Render REST API"],
            script="전체 구조입니다. 왼쪽 프런트는 React와 Tailwind로 만들어 Netlify와 Render 정적 사이트에 올렸고, 가운데 API는 FastAPI를 Docker로 말아 Render 웹 서비스로 돌립니다. 데이터는 TiDB 클라우드를 쓰되 로컬과 테스트에서는 SQLite로 자동 전환됩니다. Gemini는 키가 있으면 호출하고 없으면 규칙 기반으로 대체해서, 외부 서비스가 없어도 서비스는 항상 뜨도록 했습니다. 아래쪽은 GitHub Actions가 변경된 영역만 검증하고 배포하는 흐름이고, 점선으로 표시한 수집 파이프라인은 담당자 이오리 님이 설계한 확장 영역입니다.",
            appeal="프런트/백엔드 분리 배포, 외부 의존성 격리(폴백) 설계"),
    5: dict(title="기술 선택의 근거 (Why)", sec=75, visual="표: 선택 / 이유 / 포기한 것(트레이드오프)",
            body=["FastAPI: Pydantic 검증 + Depends 기반 RBAC + 자동 OpenAPI", "TiDB + SQLite 폴백: 운영은 MySQL 호환 클라우드, 테스트는 격리된 임시 DB", "직접 구현한 SVG 차트: 라이브러리 0개, 번들 gzip 146KB, Gap Bridge 같은 도메인 시각화", "Gemini + 규칙 기반 폴백: 키·비용·장애와 무관하게 데모 동작", "Render REST API 배포: Deploy Hook 대신 상태 폴링·로그 수집"],
            script="기술은 유행이 아니라 이유로 골랐습니다. FastAPI는 요청 검증과 권한 검사를 의존성 주입으로 깔끔하게 걸 수 있어서 선택했습니다. 데이터베이스는 운영에서는 MySQL 호환 TiDB, 테스트에서는 임시 SQLite로 격리해 같은 SQL로 둘 다 돌립니다. 차트는 라이브러리를 쓰지 않고 SVG로 직접 만들어서 번들을 줄이고, 기업 요구 대비 갭 같은 저희 도메인에 맞는 시각화를 만들 수 있었습니다. AI도 키가 없으면 규칙 기반으로 내려가게 해서 장애가 서비스 전체로 번지지 않게 했습니다.",
            appeal="'무엇을 썼나'가 아니라 '무엇을 포기하고 무엇을 얻었나'를 말하는 의사결정 근거"),
    6: dict(title="핵심 기술 ①  수요 데이터 파이프라인", sec=90, visual="5단계 흐름(수집→정제→분석→적재→서비스) + 구현 현황 표(현재/로드맵)",
            body=["수집: Requests·BS4·Playwright, 공공데이터포털·고용24·AI Hub", "정제: pandas·NumPy (중복·결측·표준화)", "분석: 형태소 분석 → 역량 사전 18종(별칭 매핑) 키워드 추출", "적재: demand_stats(월×직무×산업×지역×역량) 6,912행", "서비스: 최근 3개월 vs 직전 3개월 급상승률, 직무별 요구 수준 정규화", "현재 구현: 규칙 기반 추출·집계 API·시계열 데이터 모델 / 로드맵: 실수집 크롤러·스케줄러"],
            script="수요 분석의 뼈대는 이 다섯 단계 파이프라인입니다. 채용공고와 공공 데이터를 모으고, pandas로 정제하고, 형태소 분석 결과를 역량 사전에 매핑해 키워드를 뽑아, 월·직무·산업·지역·역량 단위로 TiDB에 쌓습니다. 서비스 단에서는 최근 석 달과 직전 석 달을 비교해 급상승 역량을 계산하고, 직무별 요구 수준도 이 빈도로 정규화합니다. 솔직하게 말씀드리면, 지금 배포본의 수치는 공공 데이터의 분포를 모사한 시드 데이터이고 실제 크롤러와 스케줄러는 다음 단계입니다. 대신 수집 결과가 들어오면 바로 붙을 데이터 모델과 집계 API는 완성되어 있습니다.",
            appeal="구현 범위와 로드맵을 정직하게 구분 — 데이터 모델·집계 로직은 실제 동작"),
    7: dict(title="핵심 기술 ②  갭 분석과 추천 알고리즘", sec=90, visual="좌: 수식 박스 5개 / 우: 진단 결과 화면(레이더 + Gap Bridge)",
            body=["점수 = 정답 60 + 자신감×8  (최대 100)", "요구 수준 = 55 + 40 × (최근 3개월 빈도 ÷ 직무 내 최대 빈도)", "갭 = max(0, 요구 − 점수) · 준비도 = Σmin(점수,요구) ÷ Σ요구", "강의 점수 = Σ(커버하는 갭) × 난이도 보정 ÷ (1 + 시간/40)", "매칭률 = 60 + 39 × 강의 점수 ÷ 최고 점수 → 3단계 로드맵 배치"],
            script="분석 로직은 설명 가능하게 만들었습니다. 진단 점수는 정답 여부 60점에 자신감 점수를 더하고, 기업 요구 수준은 최근 석 달 공고 빈도를 직무 안에서 정규화해 55에서 95 사이로 둡니다. 둘의 차이가 갭이고, 강의는 자신이 메워주는 갭의 합을 학습 시간으로 나눠 점수화합니다. 그래서 같은 효과라면 짧고 쉬운 강의가 먼저 추천됩니다. 이 결과를 레이더와 갭 브릿지로 시각화했는데, 검은 눈금이 기업 요구, 사선 구간이 채워야 할 부분입니다. 블랙박스 모델이 아니라서 왜 이 강의가 추천됐는지 화면에서 바로 설명됩니다.",
            appeal="수식 단위의 설명 가능성(Explainability) + 도메인 특화 시각화"),
    8: dict(title="인증·보안과 로그인 UX", sec=70, visual="좌: 로그인 화면 캡처 / 우: 보안 체크리스트",
            body=["Split 레이아웃, 소셜 3사(카카오·네이버·Google) 브랜드 가이드 버튼 + '최근 사용'", "비밀번호 정규식(영문 대·소문자+숫자+특수문자 8자↑) 프런트·서버 동일 검증", "테스트 계정 3종(학습자·기업·테스트 관리자) — 클릭 시 자동 입력 후 로그인", "JWT(HS256, 12h), PBKDF2-SHA256 310,000회 해시", "실제 관리자: ADMIN_SECRET_KEY를 서버에서 hmac.compare_digest로 검증(VITE_ 금지)"],
            script="로그인은 면접관님도 바로 체험하실 수 있게 설계했습니다. 소셜 로그인 버튼은 카카오, 네이버, 구글 각 사의 브랜드 가이드를 따랐고 마지막에 쓴 방식에는 최근 사용 표시가 붙습니다. 그 아래 테스트 계정 버튼을 누르면 자동으로 입력되고 로그인됩니다. 보안 쪽에서는 비밀번호 규칙을 프런트와 서버가 똑같이 검증하고, 해시는 PBKDF2 31만 회, 토큰은 JWT를 씁니다. 실제 관리자는 서버 환경 변수의 비밀 키로만 들어올 수 있고, 이 키는 프런트 코드에 절대 노출되지 않도록 분리했습니다.",
            appeal="사용성(원클릭 체험)과 보안(서버 검증·키 분리)의 균형"),
    9: dict(title="핵심 유저 플로우: 진단에서 Pick까지", sec=80, visual="상단 6단계 칩 + 하단 두 화면(진단 결과 / 맞춤 Pick)",
            body=["직무 선택 → 역량별 문항 + 자신감 → 레이더·갭 → Pick(매칭·로드맵) → 수강·진도 → 마이페이지 리포트", "진단 결과는 DB에 저장되어 Pick·메인·마이페이지가 같은 데이터를 공유", "스켈레톤·빈 상태·에러 상태를 모든 데이터 영역에 동일 컴포넌트로 적용"],
            script="핵심 사용자 흐름입니다. 학습자는 직무를 고르고 역량별 문항에 답하면, 레이더 차트와 기업 요구 대비 갭이 나옵니다. 여기서 한 번 더 누르면 갭을 가장 크게 줄이는 강의가 매칭률과 함께 나오고, 1단계 기초부터 3단계 실전까지 로드맵으로 배치됩니다. 진단 결과는 DB에 저장돼서 메인의 준비도 카드와 마이페이지 성취도 리포트가 같은 데이터를 보여줍니다. 로딩과 빈 상태, 에러 상태는 하나의 컴포넌트로 일관되게 처리해서 서버가 깨어나는 동안에도 화면이 비지 않습니다.",
            appeal="데이터 한 번 입력 → 여러 화면에 일관 반영, 상태 UI 표준화"),
    10: dict(title="반응형 UI/UX와 디자인 시스템", sec=70, visual="모바일 목업 2개(홈, 우측 드로어) + 디자인 토큰 요약",
             body=["햄버거↔X 전환(300ms) + 우→좌 드로어, 모바일 하단 탭바", "폰트 이원화: Sora(제목·수치) / Pretendard(본문), 크기 스케일 Display~Caption", "4px 배수 스페이싱, 12컬럼·최대 1280px, 카드 4/2/1열", "컬러 토큰: 인디고(메인) + 시그널 민트(포인트 1종), 시맨틱 변수", "To the Top: 300px 이후 페이드인, 스크롤 진행률 링, AI 튜터 버튼과 겹치지 않는 배치"],
             script="디자인은 토큰으로 표준화했습니다. 제목과 수치에는 Sora, 본문에는 Pretendard를 쓰고, 크기는 디스플레이부터 캡션까지 단계화했습니다. 간격은 4픽셀 배수, 그리드는 12컬럼에 최대 1280픽셀이며 카드는 데스크톱 4열, 태블릿 2열, 모바일 1열입니다. 모바일에서는 햄버거가 X로 바뀌면서 오른쪽에서 드로어가 들어오고, 하단 탭바로 핵심 다섯 메뉴를 엄지로 누를 수 있습니다. 우측 하단에는 스크롤 진행률이 링으로 표시되는 To the Top 버튼을 AI 튜터 버튼과 겹치지 않게 쌓았습니다.",
             appeal="1인이 아닌 팀 협업에서도 유지되는 토큰 기반 디자인 시스템"),
    11: dict(title="관리자 백오피스와 권한 제어(RBAC)", sec=70, visual="좌: 테스트 관리자 화면(읽기 전용 배지) / 우: 권한×기능 표 + 3중 방어선",
             body=["학습자·기업 담당자·실제 관리자(admin)·테스트 관리자(admin_readonly) 4개 권한", "admin: 회원·권한, 강의, 역량 태그, 공지 전체 CRUD", "admin_readonly: 모든 화면 조회 가능, 변경 요청은 403 (읽기 전용 배지·툴팁·토스트)", "방어선 ① UI(WriteButton·배지) ② 라우트 가드 ProtectedRoute ③ 서버 미들웨어 + Depends(require_admin)"],
             script="관리자 영역은 권한을 네 단계로 나눴습니다. 실제 관리자는 회원 권한 변경, 강의와 태그, 공지까지 전부 수정할 수 있고, 테스트 관리자는 화면은 똑같이 보지만 읽기 전용입니다. 중요한 점은 프런트만 믿지 않는다는 것입니다. 버튼을 비활성화하는 것은 보조 수단이고, 최종 방어는 서버 미들웨어가 테스트 관리자의 POST, PUT, PATCH, DELETE를 모두 403으로 막는 것입니다. 이 동작은 자동 테스트로 고정해 두어서 권한이 우회되는 회귀를 막고 있습니다.",
             appeal="UI 제어 ≠ 보안 — 서버 최종 검증과 회귀 테스트"),
    12: dict(title="DevOps: GitHub Actions 조건부 배포", sec=80, visual="파이프라인 다이어그램(push→경로 감지→테스트/빌드→Render API→헬스체크) + 시크릿 위치 표",
             body=["dorny/paths-filter로 backend·frontend 변경 영역만 실행", "API: pytest → docker build → 컨테이너 /health 스모크 테스트 → Render 배포", "Web: npm run build → Render 정적 사이트 배포", "Render REST API로 배포 후 live까지 폴링, 실패 시 빌드·앱 로그를 Actions에 출력", "환경 변수: 로컬 .env / Render 대시보드(sync:false) / GitHub Secret(RENDER_API_KEY) 분리, VITE_만 프런트 노출"],
             script="배포는 GitHub Actions 한 곳에서 통제합니다. main에 푸시하면 먼저 어느 영역이 바뀌었는지 감지하고, 백엔드는 테스트와 도커 이미지 빌드, 컨테이너 헬스 체크까지 통과해야 Render에 배포됩니다. 프런트는 빌드가 통과해야 배포됩니다. 배포 훅 대신 Render API를 쓴 이유는 배포 상태를 live가 될 때까지 추적하고, 실패하면 빌드 로그와 앱 로그를 Actions 화면에 그대로 찍을 수 있기 때문입니다. 비밀 값은 로컬 환경 파일, Render 대시보드, GitHub 시크릿으로 나눠 관리하고 프런트에는 VITE 접두어 변수만 나갑니다.",
             appeal="변경 감지·검증 게이트·관측 가능성(로그)을 갖춘 실무형 파이프라인"),
    13: dict(title="트러블슈팅: 실제로 부딪힌 문제 3가지", sec=110, visual="3열 카드(증상 / 원인 / 해결 / 결과) + 보너스 한 줄",
             body=["① Render build_failed — 'open Dockerfile: no such file' → 서비스 Root Directory(backend) ≠ 저장소 루트 Dockerfile → 배포 스크립트가 서비스 설정을 조회·교정(PATCH), 실패 로그 자동 출력", "② 컨테이너 기동 직후 종료 — DATABASE_URL이 .env.example의 USER:PASS@HOST 예시값 → pymysql 2003 → 플레이스홀더 감지 시 경고 + SQLite 폴백, 배포 전 사전 경고", "③ 테스트 관리자 우회 가능성 — UI만 막으면 API 직접 호출로 변경 가능 → 미들웨어 403 + 튜터 질의만 예외, 회귀 테스트로 고정", "보너스: 무료 서버 콜드 스타트 → 스켈레톤 + 4초 후 안내 + 60초 응답 캐시"],
             script="가장 말씀드리고 싶은 부분입니다. 첫 번째, Render 배포가 build failed로 떨어졌습니다. 로그를 보니 도커 파일을 찾을 수 없다는 메시지였고, 서비스의 루트 디렉터리가 backend로 잡혀 있었는데 도커 파일은 저장소 루트에 있었습니다. 그래서 배포 스크립트가 서비스 설정을 읽어 어긋나면 API로 교정하고, 실패 시 로그를 자동 출력하게 만들었습니다. 두 번째, 빌드는 됐는데 컨테이너가 바로 죽었습니다. 환경 변수에 예시용 DB 주소가 그대로 들어 있었던 겁니다. 플레이스홀더를 감지해 경고하고 SQLite로 내려가게 해서 서비스가 먼저 살아나도록 했습니다. 세 번째, 읽기 전용 관리자를 화면에서만 막으면 API 직접 호출로 뚫린다는 점을 발견해 서버 미들웨어로 막고 테스트로 고정했습니다.",
             appeal="증상→원인→해결→재발 방지(자동화·테스트)까지 이어지는 문제 해결 서사"),
    14: dict(title="산출물과 협업 체계", sec=50, visual="좌: 담당자별 산출물 표 / 우: 협업 규칙 + 저장소 현황",
             body=["김모란: 요구사항 정의서·ERD·API 명세·WBS", "박미금: 화면 설계서·UI 가이드·사용자 매뉴얼", "이오리: 데이터 수집 계획서·정의서·분석 보고서", "홍기흥: AI 모델·프롬프트 설계서·배포·운영 가이드", "규칙: main/develop/feature 브랜치, feat·fix·docs 커밋 접두어, PR 1인 이상 리뷰", "현재 저장소: README, AGENTS.md(작업 규칙), 자동 OpenAPI(/docs), 발표자료 생성 스크립트"],
             script="4명이 일하다 보니 규칙과 문서가 곧 품질이었습니다. 산출물은 담당자별로 나눴습니다. 저는 요구사항과 ERD, API 명세를, 미금 님은 화면 설계와 UI 가이드를, 오리 님은 데이터 정의서와 분석 보고서를, 기흥 님은 AI 설계서와 배포 가이드를 맡았습니다. 코드는 main, develop, feature 브랜치로 나누고 커밋 메시지 접두어를 통일했으며 모든 PR은 다른 팀원 한 명 이상이 리뷰합니다. 저장소에는 작업 규칙을 적은 에이전트 문서와 자동 생성되는 API 문서가 있어서 새 팀원도 바로 합류할 수 있습니다.",
             appeal="역할 분담·리뷰 프로세스·문서 자동화 — 팀 개발 역량"),
    15: dict(title="회고와 다음 단계", sec=60, visual="3열: 배운 점 / 한계(정직) / 로드맵",
             body=["배운 점: 문제 정의 → 설명 가능한 로직, 서버 최종 검증, 배포도 코드로 관리", "한계: 실수집 크롤러 미구현(시드 데이터), Gemini 키·TiDB 연결은 운영 설정 필요, 무료 서버 콜드 스타트", "다음: 실수집 파이프라인(스케줄러), Gemini 문항 생성·RAG 튜터, 임베딩 기반 매칭", "다음: TiDB 전환 + 마이그레이션, Docker 기반 AWS EC2 병행 배포, E2E 테스트"],
             script="회고입니다. 가장 크게 배운 것은 기능 수보다 문제 정의와 설명 가능한 로직이 중요하다는 점, 그리고 보안과 배포도 코드로 관리해야 재현된다는 점이었습니다. 한계도 분명합니다. 실제 크롤러는 아직 시드 데이터로 대체했고, Gemini 키와 TiDB 연결은 운영 설정이 필요합니다. 다음 단계로는 수집 스케줄러를 붙여 실데이터로 전환하고, Gemini로 진단 문항을 생성하며 튜터를 RAG로 고도화하려고 합니다. 인프라는 이미 도커 기반이라 AWS EC2에 병행 배포하는 것도 어렵지 않게 확장할 수 있습니다.",
             appeal="한계를 먼저 말하는 신뢰감 + 구체적이고 실현 가능한 로드맵"),
    16: dict(title="Q&A · 라이브 데모 안내", sec=45, visual="다크 배경 + 데모 3단계 + QR + 예상 질문 6",
             body=["데모: ① 학습자 로그인 → 진단 → Pick ② 기업 담당자 → 수요 등록(AI 구조화) ③ 테스트 관리자 → 수정 시 403", f"라이브: {SITE}", f"저장소: {REPO}", "예상 질문: 실데이터? / 추천 근거? / 읽기 전용 우회? / 배포 실패 대응? / 확장성? / 팀 협업?"],
             script="발표는 여기까지입니다. 질문 받기 전에 3분 정도 라이브로 보여드리겠습니다. 학습자로 로그인해서 진단과 맞춤 추천을 보고, 기업 담당자로 채용 요건을 입력하면 AI가 구조화하는 것을, 마지막으로 테스트 관리자로 들어가 수정 버튼을 눌렀을 때 서버가 막는 것까지 확인하실 수 있습니다. 화면 오른쪽에 자주 받는 질문과 답변 요약을 정리해 두었으니 편하게 질문 주세요. 경청해 주셔서 감사합니다.",
             appeal="즉시 체험 가능한 데모 시나리오 + 예상 질문 선제 대비"),
}
OWNERS = {1: "김모란", 2: "김모란", 3: "김모란 · 박미금", 4: "김모란 · 홍기흥", 5: "김모란", 6: "이오리 · 홍기흥", 7: "홍기흥 · 김모란", 8: "박미금 · 김모란", 9: "박미금 · 홍기흥",
          10: "박미금", 11: "김모란 · 박미금", 12: "홍기흥", 13: "전원", 14: "전원", 15: "전원", 16: "전원"}


# ───────────────────────── 슬라이드 빌더 ─────────────────────────
def s1(sl):
    text(sl, 0.7, 0.7, 6, 0.3, [[("●", {"color": MINT}), ("   AI LEARNING × ENTERPRISE DEMAND", {"color": "B8BDE0"})]], 11, bold=True)
    text(sl, 0.7, 1.55, 7.3, 1.4, [[("cogni", {"color": WHITE}), ("pick", {"color": MINT})]], 66, bold=True, spacing=0.95)
    text(sl, 0.7, 3.0, 7.2, 1.3, ["기업이 찾는 역량을", [("데이터로 ", {"color": WHITE}), ("Pick.", {"color": "8B7CFF"})]], 34, WHITE, True, spacing=1.1)
    text(sl, 0.7, 4.55, 6.8, 0.7, "AI 지능형 학습 플랫폼 & 기업 수요 분석 비즈니스 플랫폼\n채용 데이터 × K-AI 데이터 × 학습 운영", 14, "B8BDE0", spacing=1.35)
    card(sl, 0.7, 5.5, 6.6, 0.95, fill="171C4D", line="2F3677", radius=0.12)
    text(sl, 0.95, 5.62, 6.2, 0.3, [[("발표  ", {"color": "8F96C9"}), ("김모란", {"bold": True, "color": WHITE}), ("  PM · 백엔드", {"color": "8F96C9"})]], 14)
    text(sl, 0.95, 6.0, 6.2, 0.3, "팀  김모란(조장) · 박미금 · 이오리 · 홍기흥", 12.5, "B8BDE0")
    for i, (url, lab, sub) in enumerate([(SITE, "라이브 데모", "cognipick.onrender.com"), (REPO, "GitHub", "fsclass-n/cognipick")]):
        x = 8.4 + i * 2.45
        card(sl, x, 1.7, 2.25, 3.0, fill=WHITE, line=WHITE, radius=0.08)
        picture(sl, qr_png(url), x + 0.2, 1.9, 1.85, 1.85)
        text(sl, x, 3.9, 2.25, 0.3, lab, 14, INK, True, "c")
        text(sl, x, 4.22, 2.25, 0.3, sub, 10, MUTED, align="c")
    text(sl, 8.4, 5.0, 4.7, 0.9, ["QR을 스캔하면 바로 체험할 수 있어요.", "테스트 계정 버튼으로 가입 없이 로그인"], 12, "B8BDE0", spacing=1.4)
    for i, c in enumerate([BRAND, MINT, AMBER, ROSE]):
        shape(sl, MSO_SHAPE.OVAL, 8.4 + i * 0.32, 6.15, 0.2, 0.2, c)


def s2(sl):
    cards = [("01", "학습 ≠ 채용", "학습자는 무엇을 배워야 취업에 유리한지 모른 채 '인기 강의'를 따라간다", BRAND),
             ("02", "수요 데이터의 파편화", "채용공고 · 공공 고용 통계 · AI Hub 데이터가 제각각 흩어져 비교가 어렵다", ROSE),
             ("03", "감(感)으로 하는 운영", "추천이 수강·수료로 이어지는지 진도·성과를 숫자로 보기 어렵다", AMBER)]
    for i, (n, t, d, c) in enumerate(cards):
        y = 1.85 + i * 1.5
        card(sl, 0.6, y, 5.9, 1.3)
        shape(sl, MSO_SHAPE.RECTANGLE, 0.6, y + 0.18, 0.07, 0.94, c)
        text(sl, 0.9, y + 0.18, 0.6, 0.5, n, 22, c, True)
        text(sl, 1.6, y + 0.17, 4.7, 0.35, t, 16, INK, True)
        text(sl, 1.6, y + 0.58, 4.7, 0.65, d, 12, MUTED, spacing=1.25)
    shape(sl, MSO_SHAPE.RIGHT_ARROW, 6.62, 3.55, 0.55, 0.4, MINT)
    card(sl, 7.3, 1.85, 5.43, 4.3, fill=INK, line=INK, radius=0.05)
    text(sl, 7.65, 2.05, 4.8, 0.3, "SOLUTION  ·  순환 구조", 11, MINT, True)
    steps = [("수요 분석", "기업이 원하는 역량을 읽는다"), ("역량 진단", "내 위치를 점수로 본다"), ("갭 계산", "요구 − 내 점수"), ("맞춤 Pick", "가장 빠른 강의·로드맵"), ("운영 지표", "클릭률·전환·수료를 환류")]
    for i, (t, d) in enumerate(steps):
        y = 2.5 + i * 0.7
        shape(sl, MSO_SHAPE.OVAL, 7.65, y + 0.05, 0.4, 0.4, BRAND if i < 4 else MINT)
        text(sl, 7.65, y + 0.05, 0.4, 0.4, str(i + 1), 13, WHITE if i < 4 else INK, True, "c", "m")
        if i < 4:
            shape(sl, MSO_SHAPE.RECTANGLE, 7.835, y + 0.45, 0.03, 0.3, "3A3F7A")
        text(sl, 8.25, y + 0.02, 1.6, 0.4, t, 15, WHITE, True, anchor="m")
        text(sl, 9.75, y + 0.02, 2.8, 0.4, d, 11.5, "B8BDE0", anchor="m")
    text(sl, 0.6, 6.3, 12.1, 0.3, [[("한 줄 가치  ", {"color": BRAND, "bold": True}), ("기업이 찾는 역량을 데이터로 읽고, 나에게 맞는 학습을 Pick.", {})]], 14)


def s3(sl):
    cols = [("01", "기업 수요 분석", BRAND, ["직무·산업·지역 필터", "역량 워드클라우드 + 12개월 시계열", "급상승 역량 인사이트", "기업 수요 등록 → AI 필수/우대 구조화"], "demand"),
            ("02", "AI 역량 진단", MINT, ["직무별 역량 문항 + 자신감", "역량 레이더 차트", "기업 요구 대비 Gap Bridge", "직무 준비도(%) 산출"], "diagnosis"),
            ("03", "맞춤 학습 Pick", AMBER, ["갭 기반 강의 매칭률", "3단계 학습 로드맵 타임라인", "AI 튜터: 스트리밍 + 출처 표기", "진도·성취도 리포트"], "pick")]
    for i, (n, t, c, items, shot) in enumerate(cols):
        x = 0.6 + i * 4.1
        card(sl, x, 1.75, 3.9, 4.15)
        picture(sl, crop_to(ASSETS / f"{shot}.png", 3.9 / 1.55, 0.0), x, 1.75, 3.9, 1.55)
        shape(sl, MSO_SHAPE.RECTANGLE, x, 3.3, 3.9, 0.05, c)
        text(sl, x + 0.25, 3.5, 0.8, 0.4, n, 20, c if c != MINT else "0AA57C", True)
        text(sl, x + 0.9, 3.52, 2.9, 0.4, t, 17, INK, True)
        bullets(sl, x + 0.25, 4.05, 3.5, items, 12, MUTED, 4, c if c != MINT else "0AA57C", 1.8)
    card(sl, 0.6, 6.05, 12.13, 0.55, fill=INK, line=INK, radius=0.3)
    text(sl, 0.6, 6.05, 12.13, 0.55, [[("운영 시스템  ", {"color": MINT, "bold": True}), ("회원·권한 관리  ·  콘텐츠·역량 태그  ·  공지  ·  수집·분석·추천·학습 모니터링 대시보드", {"color": WHITE})]], 13, align="c", anchor="m")


def s4(sl):
    def box(x, y, w, h, title, lines, fill=WHITE, line=LINE, tcol=INK, dcol=MUTED, dash=False):
        card(sl, x, y, w, h, fill=fill, line=line, dash=dash)
        text(sl, x + 0.2, y + 0.14, w - 0.4, 0.3, title, 13, tcol, True)
        text(sl, x + 0.2, y + 0.5, w - 0.4, h - 0.55, lines, 10.5, dcol, spacing=1.3)

    text(sl, 0.6, 1.62, 3, 0.25, "CLIENT", 10, MUTED, True)
    text(sl, 4.85, 1.62, 3, 0.25, "API  (Docker · Render)", 10, MUTED, True)
    text(sl, 9.3, 1.62, 3, 0.25, "DATA · EXTERNAL", 10, MUTED, True)
    box(0.6, 1.9, 3.5, 1.5, "React 19 + Vite", ["Tailwind v4 디자인 토큰", "SVG 차트 · 라우트 가드", "Netlify 데모 · Render Static"])
    box(0.6, 3.6, 3.5, 1.1, "브라우저 · 모바일", ["반응형 Drawer · 하단 탭바"], fill=BG)
    box(4.85, 1.9, 3.6, 2.8, "FastAPI", ["Auth · JWT · OAuth", "Demand (집계·AI 구조화)", "Diagnosis · Recommend", "Tutor (SSE 스트리밍)", "Admin · monitoring", "read_only_guard 미들웨어"], fill=INK, line=INK, tcol=MINT, dcol="DDE1FF")
    box(9.3, 1.9, 3.43, 1.15, "TiDB Cloud", ["MySQL 호환 · TLS  ⟷  SQLite 폴백"])
    box(9.3, 3.2, 3.43, 0.7, "Gemini API (선택)", [], line=MINT)
    text(sl, 9.5, 3.58, 3.1, 0.3, "키 없으면 규칙 기반 폴백", 10, MUTED)
    box(9.3, 4.05, 3.43, 0.65, "OAuth  Google · Naver · Kakao", [])
    for x, y in [(4.2, 2.45), (8.55, 2.45)]:
        shape(sl, MSO_SHAPE.LEFT_RIGHT_ARROW, x, y, 0.55, 0.32, MINT)
    shape(sl, MSO_SHAPE.RIGHT_ARROW, 4.2, 4.0, 0.55, 0.32, "C9CDEB")
    card(sl, 0.6, 4.95, 12.13, 0.85, fill=WHITE, line=BRAND, lw=1.5)
    steps = ["git push (main)", "paths-filter", "pytest · docker build · npm build", "Render REST API", "live + /health"]
    for i, s in enumerate(steps):
        x = 0.85 + i * 2.38
        pill(sl, x, 5.2, 1.95 if i != 2 else 2.35, 0.38, s, BRAND if i != 3 else INK, size=10)
        if i < 4:
            text(sl, x + (2.0 if i != 2 else 2.4), 5.2, 0.3, 0.38, "›", 16, MUTED, True, "c", "m")
    text(sl, 0.8, 4.98, 3, 0.2, "CI/CD  GitHub Actions", 9, BRAND, True)
    card(sl, 0.6, 5.95, 12.13, 0.55, fill=BG, line="8F96C9", dash=True)
    text(sl, 0.6, 5.95, 12.13, 0.55, [[("pipeline/  ", {"bold": True, "color": BRAND}), ("수집(Requests·BS4·Playwright) → 정제(pandas) → 분석(형태소) → TiDB 적재   ", {}), ("[ 담당 이오리 · 확장 영역 ]", {"color": MUTED})]], 11.5, align="c", anchor="m")


def table(sl, x, y, widths, head, rows, size=11, row_h=0.62, head_fill=INK, zebra=True, dark=False):
    cx = x
    for w, h in zip(widths, head):
        shape(sl, MSO_SHAPE.RECTANGLE, cx, y, w, 0.42, head_fill)
        text(sl, cx + 0.15, y, w - 0.3, 0.42, h, 11, WHITE, True, anchor="m")
        cx += w
    for r, row in enumerate(rows):
        cy = y + 0.42 + r * row_h
        shape(sl, MSO_SHAPE.RECTANGLE, x, cy, sum(widths), row_h, WHITE if r % 2 == 0 or not zebra else "F7F8FD", LINE, 0.5)
        cx = x
        for c, (w, v) in enumerate(zip(widths, row)):
            text(sl, cx + 0.15, cy, w - 0.3, row_h, v, size, INK if c == 0 else MUTED, c == 0, anchor="m", spacing=1.15)
            cx += w


def s5(sl):
    rows = [("FastAPI", "Pydantic 검증 · Depends로 RBAC · 자동 OpenAPI", "Django의 풍부한 어드민 대신 가벼움·명시성"),
            ("TiDB + SQLite 폴백", "운영은 MySQL 호환 클라우드, 테스트·장애 시 격리된 SQLite", "완전한 DB 일원화 대신 기동 안정성 확보"),
            ("React + Tailwind v4", "@theme 디자인 토큰, 번들 JS gzip 146KB", "UI 키트 대신 자체 토큰·컴포넌트"),
            ("직접 구현 SVG 차트", "라이브러리 0개 · Gap Bridge 등 도메인 시각화", "범용 차트 기능 대신 번들 절감·커스터마이징"),
            ("Gemini + 규칙 기반 폴백", "키·비용·장애와 무관하게 데모 동작", "응답 품질 대신 가용성 우선 (키 설정 시 자동 전환)"),
            ("Render REST API 배포", "Deploy Hook 대신 상태 폴링·로그 수집·설정 교정", "설정 단순함 대신 관측 가능성")]
    table(sl, 0.6, 1.8, [2.75, 5.0, 4.38], ["선택", "이유", "포기한 것 (트레이드오프)"], rows, 11.5, 0.7)


def s6(sl):
    steps = [("수집", "Requests · BS4\nPlaywright", "공공데이터포털\n고용24 · AI Hub"), ("정제", "pandas · NumPy", "중복·결측 제거\n표준화"), ("분석", "형태소 분석", "역량 사전 18종\n별칭 매핑"),
             ("적재", "TiDB", "demand_stats\n6,912행"), ("서비스", "FastAPI 집계", "급상승률 · 요구 수준")]
    w = 2.3
    for i, (t, a, b) in enumerate(steps):
        x = 0.6 + i * (w + 0.16)
        card(sl, x, 1.8, w, 2.35, fill="12163F", line="2A2F63", radius=0.06)
        pill(sl, x + 0.2, 1.98, 0.5, 0.3, f"0{i + 1}", MINT, INK, 10)
        text(sl, x + 0.82, 1.97, w - 0.9, 0.35, t, 16, WHITE, True, anchor="m")
        text(sl, x + 0.2, 2.5, w - 0.4, 0.7, a, 12, "DDE1FF", True, spacing=1.25)
        text(sl, x + 0.2, 3.25, w - 0.4, 0.8, b, 11, "9AA0C8", spacing=1.3)
        if i < 4:
            text(sl, x + w - 0.02, 2.75, 0.2, 0.4, "›", 20, MINT, True, "c", "m")
    card(sl, 0.6, 4.4, 6.0, 2.1, fill="171C4D", line="2F3677", radius=0.05)
    text(sl, 0.85, 4.55, 5.5, 0.3, "현재 구현됨  (배포본)", 12, MINT, True)
    bullets(sl, 0.85, 4.95, 5.55, ["역량 사전(별칭) 기반 규칙 추출 · 필수/우대 분류", "월×직무×산업×지역×역량 데이터 모델 + 집계 API", "최근 3개월 vs 직전 3개월 급상승률, 요구 수준 정규화", "시계열·워드클라우드·필터 대시보드"], 11.5, "DDE1FF", 3, MINT, 1.5)
    card(sl, 6.75, 4.4, 5.98, 2.1, fill="171C4D", line="2F3677", radius=0.05, dash=True)
    text(sl, 7.0, 4.55, 5.5, 0.3, "로드맵  (이오리 · 홍기흥)", 12, AMBER, True)
    bullets(sl, 7.0, 4.95, 5.5, ["실수집 크롤러 + 스케줄러로 시드 데이터 대체", "Kiwi 형태소 분석 + 임베딩 유사도 매핑", "수집·분석 성공률을 모니터링 대시보드에 연결", "원천 데이터 S3 보관 · 재처리 파이프라인"], 11.5, "DDE1FF", 3, AMBER, 1.5)


def s7(sl):
    items = [("진단 점수", "정답 60 + 자신감 × 8   (≤ 100)"), ("요구 수준", "55 + 40 × (최근 3개월 빈도 ÷ 직무 내 최대)"), ("갭 · 준비도", "gap = max(0, 요구 − 점수)\n준비도 = Σ min(점수, 요구) ÷ Σ 요구"),
             ("강의 점수", "Σ(커버하는 갭) × 난이도 보정 ÷ (1 + 시간/40)"), ("매칭률", "60 + 39 × 강의 점수 ÷ 최고 점수")]
    y = 1.75
    for i, (t, f) in enumerate(items):
        h = 1.0 if i == 2 else 0.8
        card(sl, 0.6, y, 5.6, h, fill="12163F", line="2A2F63", radius=0.08)
        text(sl, 0.85, y + 0.1, 5.2, 0.25, t, 10.5, MINT, True)
        text(sl, 0.85, y + 0.38, 5.2, h - 0.4, f, 12, "DDE1FF", spacing=1.25)
        y += h + 0.12
    browser(sl, "diagnosis", 6.45, 1.75, 6.28, 1.9, 0.0, label="cognipick.onrender.com/diagnosis", dark=True)
    text(sl, 6.45, 5.6, 6.28, 1.0, [[("시각화  ", {"color": MINT, "bold": True}), ("레이더 · Gap Bridge · 워드클라우드 · 시계열을 SVG로 직접 구현. 검은 눈금 = 기업 요구, 사선 = 채워야 할 구간.", {"color": "B8BDE0"})]], 12, spacing=1.35)


def s8(sl):
    browser(sl, "login", 0.6, 1.75, 6.9, 1.75, 0.0, label="cognipick.onrender.com/login")
    chk = [("Split 레이아웃", "풀블리드 사진 + 글래스 위젯, 우측 폼"), ("소셜 3사", "카카오·네이버·Google 브랜드 가이드 + 최근 사용"), ("비밀번호", "정규식 프런트·서버 동일 검증"),
           ("테스트 계정", "학습자·기업·테스트 관리자 원클릭"), ("토큰·해시", "JWT HS256 12h · PBKDF2-SHA256 31만 회"), ("실제 관리자", "ADMIN_SECRET_KEY 서버 검증, VITE_ 금지")]
    for i, (t, d) in enumerate(chk):
        y = 1.75 + i * 0.72
        card(sl, 7.75, y, 4.98, 0.62, radius=0.1)
        shape(sl, MSO_SHAPE.OVAL, 7.92, y + 0.17, 0.28, 0.28, MINT)
        text(sl, 7.92, y + 0.17, 0.28, 0.28, "✓", 10, INK, True, "c", "m")
        text(sl, 8.35, y + 0.06, 4.3, 0.25, t, 12, INK, True)
        text(sl, 8.35, y + 0.31, 4.3, 0.25, d, 10, MUTED)
    text(sl, 0.6, 6.15, 6.9, 0.4, "면접관 체험 포인트: 테스트 계정 버튼 → 자동 입력 → 로그인 (가입 없이 3개 권한 확인)", 11.5, BRAND, True)


def s9(sl):
    flow = ["직무 선택", "역량 문항", "레이더·갭", "맞춤 Pick", "수강·진도", "리포트"]
    for i, f in enumerate(flow):
        x = 0.6 + i * 2.05
        pill(sl, x, 1.72, 1.8, 0.42, f"{i + 1}  {f}", BRAND if i < 3 else INK, size=11.5)
        if i < 5:
            text(sl, x + 1.8, 1.72, 0.25, 0.42, "›", 16, MUTED, True, "c", "m")
    h1 = browser(sl, "diagnosis", 0.6, 2.35, 6.0, 2.0, 0.0, label="진단 결과 · 레이더 + Gap Bridge")
    browser(sl, "pick", 6.73, 2.35, 6.0, 2.0, 0.0, label="맞춤 Pick · 갭 + 로드맵")
    text(sl, 0.6, 2.35 + h1 + 0.2, 12.1, 0.8, [[("● ", {"color": BRAND}), ("진단 결과는 DB에 저장 → 메인 준비도 카드·Pick·마이페이지가 같은 데이터를 공유", {})], [("● ", {"color": BRAND}), ("스켈레톤 · 빈 상태 · 에러 상태를 모든 데이터 영역에 동일 컴포넌트(Async)로 적용", {})]], 12, MUTED, spacing=1.3, space_after=3)


def s10(sl):
    phone(sl, "m_home", 0.9, 1.7, 4.85)
    phone(sl, "m_drawer", 3.35, 1.7, 4.85)
    tokens = [("폰트 이원화", "Sora(제목·수치) / Pretendard(본문)"), ("타입 스케일", "Display · H1~H4 · Body · Caption"), ("스페이싱·그리드", "4px 배수 · 12컬럼 · 최대 1280px · 카드 4/2/1열"),
              ("컬러 토큰", "인디고(메인) + 시그널 민트(포인트 1종)"), ("모션", "햄버거↔X 300ms · 우→좌 드로어 · 진행률 링 Top 버튼"), ("상태 UI", "스켈레톤 · 빈 상태 · 에러 + 재시도")]
    for i, (t, d) in enumerate(tokens):
        y = 1.7 + i * 0.78
        card(sl, 6.0, y, 6.73, 0.68, radius=0.1)
        shape(sl, MSO_SHAPE.RECTANGLE, 6.0, y + 0.12, 0.06, 0.44, [BRAND, BRAND, BRAND, MINT, ROSE, AMBER][i])
        text(sl, 6.25, y + 0.07, 2.0, 0.55, t, 12, INK, True, anchor="m")
        text(sl, 8.2, y + 0.07, 4.4, 0.55, d, 10.5, MUTED, anchor="m", spacing=1.2)
    for i, (c, n) in enumerate([("4A3AFF", "indigo"), ("20D6A5", "mint"), ("0B0E2C", "ink"), ("F4F5FB", "bg")]):
        shape(sl, MSO_SHAPE.OVAL, 6.0 + i * 0.95, 6.4 - 0.05, 0.28, 0.28, c, LINE)
        text(sl, 6.34 + i * 0.95, 6.36, 0.6, 0.3, n, 9, MUTED, anchor="m")


def s11(sl):
    browser(sl, "admin_ro", 0.6, 1.75, 6.2, 1.9, 0.0, label="테스트 관리자 · 읽기 전용 모드")
    rows = [("학습자", "—", "—"), ("기업 담당자", "수요 등록·조회", "—"), ("admin_readonly", "전 화면 조회", "차단 (403)"), ("admin", "전 화면 조회", "전체 CRUD")]
    table(sl, 7.05, 1.75, [1.9, 2.0, 1.78], ["권한", "조회", "생성·수정·삭제"], rows, 10.5, 0.55)
    defs = [("① UI", "WriteButton 비활성 · 읽기 전용 배지·툴팁 · 토스트"), ("② 라우트", "ProtectedRoute(roles) — 무권한 시 메인/로그인"), ("③ 서버", "read_only_guard 미들웨어 403 + Depends(require_admin)")]
    for i, (t, d) in enumerate(defs):
        y = 4.55 + i * 0.62
        card(sl, 7.05, y, 5.68, 0.52, fill=INK if i == 2 else WHITE, line=INK if i == 2 else LINE, radius=0.12)
        pill(sl, 7.2, y + 0.11, 0.8, 0.3, t, MINT if i == 2 else BRAND, INK if i == 2 else WHITE, 10)
        text(sl, 8.1, y, 4.55, 0.52, d, 10.5, WHITE if i == 2 else MUTED, anchor="m")
    text(sl, 0.6, 5.6, 6.2, 0.9, [[("● ", {"color": BRAND}), ("회원 권한 실시간 변경 · 강의/태그/공지 CRUD · 운영 모니터링", {})], [("● ", {"color": BRAND}), ("pytest로 '읽기 가능 / 쓰기 403'을 회귀 테스트로 고정", {})]], 12, MUTED, spacing=1.3, space_after=3)


def s12(sl):
    steps = [("git push", "main"), ("changes", "paths-filter"), ("검증", "pytest\ndocker build\n/health 스모크\nnpm build"), ("deploy", "Render REST API\nlive 폴링"), ("확인", "/health\n실패 시 로그 출력")]
    for i, (t, d) in enumerate(steps):
        x = 0.6 + i * 2.45
        card(sl, x, 1.8, 2.2, 2.2, fill=INK if i == 3 else WHITE, line=INK if i == 3 else LINE, radius=0.07)
        pill(sl, x + 0.2, 1.98, 0.45, 0.28, str(i + 1), MINT if i == 3 else BRAND, INK if i == 3 else WHITE, 10)
        text(sl, x + 0.75, 1.96, 1.4, 0.32, t, 14, WHITE if i == 3 else INK, True, anchor="m")
        text(sl, x + 0.2, 2.45, 1.85, 1.5, d, 11, "DDE1FF" if i == 3 else MUTED, spacing=1.3)
        if i < 4:
            text(sl, x + 2.2, 2.6, 0.25, 0.4, "›", 20, BRAND, True, "c", "m")
    rows = [("로컬 .env", "DATABASE_URL · JWT_SECRET_KEY · ADMIN_SECRET_KEY …", "커밋 금지(.gitignore), .env.example은 키 이름만"),
            ("Render 대시보드", "sync:false 항목(DB·Gemini·OAuth 키)", "서버 런타임에만 존재"),
            ("GitHub Secrets", "RENDER_API_KEY 1개", "Deploy Hook URL 미사용"),
            ("프런트", "VITE_API_BASE_URL 만", "보안 키는 절대 VITE_ 금지")]
    table(sl, 0.6, 4.25, [2.2, 5.3, 4.63], ["위치", "저장 값", "원칙"], rows, 10.5, 0.5)


def s13(sl):
    cols = [("① Render build_failed", ROSE, "open Dockerfile: no such file", "서비스 Root Directory(backend) ≠ 저장소 루트의 Dockerfile", "배포 스크립트가 서비스 설정을 조회해 어긋나면 API로 교정(PATCH). 실패 시 Render 빌드·앱 로그를 Actions에 자동 출력", "빌드 성공 · 원인 파악 시간 단축"),
            ("② 기동 직후 종료", AMBER, "pymysql 2003 · host 'HOST'", "DATABASE_URL이 .env.example의 USER:PASS@HOST 예시값 그대로", "플레이스홀더 감지 시 경고 + SQLite 폴백, 배포 전 사전 경고 단계 추가", "서비스 live · 헬스체크 통과"),
            ("③ 읽기 전용 우회", MINT, "UI만 막으면 API 직접 호출 가능", "프런트 제어는 보안 경계가 아님", "서버 미들웨어로 변경 요청 403 일괄 차단(튜터 질의 POST만 예외) + 회귀 테스트", "권한 우회 회귀 방지")]
    for i, (t, c, sym, cause, fix, res) in enumerate(cols):
        x = 0.6 + i * 4.1
        card(sl, x, 1.75, 3.9, 4.55, fill="12163F", line="2A2F63", radius=0.05)
        shape(sl, MSO_SHAPE.RECTANGLE, x, 1.75, 3.9, 0.07, c)
        text(sl, x + 0.25, 1.98, 3.4, 0.35, t, 15, WHITE, True)
        yy = 2.5
        for lab, body, lc in [("증상", sym, "9AA0C8"), ("원인", cause, "9AA0C8"), ("해결", fix, c), ("결과", res, MINT)]:
            text(sl, x + 0.25, yy, 0.6, 0.25, lab, 10.5, lc, True)
            bh = 0.55 if lab in ("증상", "원인") else (1.05 if lab == "해결" else 0.5)
            text(sl, x + 0.9, yy, 2.8, bh, body, 11, "DDE1FF" if lab != "결과" else WHITE, lab == "결과", spacing=1.25)
            yy += bh + 0.18
    text(sl, 0.6, 6.4, 12.1, 0.3, [[("+ 보너스  ", {"color": MINT, "bold": True}), ("무료 서버 콜드 스타트 → 스켈레톤 + 4초 후 안내 문구 + 60초 응답 캐시", {"color": "B8BDE0"})]], 11.5)


def s14(sl):
    rows = [("김모란 (PM·백엔드)", "요구사항 정의서 · ERD · API 명세 · WBS"), ("박미금 (프런트·UI/UX)", "화면 설계서 · UI 가이드 · 사용자 매뉴얼"), ("이오리 (데이터)", "수집 계획서 · 데이터 정의서 · 분석 보고서"), ("홍기흥 (AI·인프라)", "AI 모델·프롬프트 설계서 · 배포·운영 가이드")]
    table(sl, 0.6, 1.8, [2.6, 3.9], ["담당", "주요 산출물"], rows, 11, 0.62)
    text(sl, 0.6, 4.95, 6.5, 0.3, "docs/", 12, BRAND, True)
    text(sl, 0.6, 5.25, 6.5, 1.3, ["md/  작업 기록 누적 (파일명에 작성자)", "프로젝트_진행일지/  일별·팀원별", "산출물/  설계서 · 데이터 · 서비스", "pdf/  완성 문서 보관  ·  발표자료.pptx"], 11, MUTED, spacing=1.35)
    card(sl, 7.3, 1.8, 5.43, 2.45, radius=0.06)
    text(sl, 7.55, 1.95, 5, 0.3, "협업 규칙", 13, INK, True)
    bullets(sl, 7.55, 2.35, 5.0, ["브랜치: main(배포) / develop / feature/{영역}-{기능}", "커밋: feat · fix · docs · refactor · chore", "모든 PR은 다른 팀원 1명 이상 리뷰 후 병합", "라이브러리 추가 시 팀 공유 · 7일 이상 지난 버전 고정"], 11, MUTED, 4, BRAND, 1.8)
    card(sl, 7.3, 4.45, 5.43, 2.05, fill=INK, line=INK, radius=0.06)
    text(sl, 7.55, 4.6, 5, 0.3, "저장소에 이미 있는 것", 13, MINT, True)
    bullets(sl, 7.55, 5.0, 5.0, ["README · AGENTS.md(작업·배포 규칙)", "FastAPI 자동 OpenAPI (/docs)", "발표자료 · 대본 생성 스크립트(tools/)"], 11, "DDE1FF", 4, MINT, 1.4)


def s15(sl):
    cols = [("배운 점", BRAND, ["기능 수보다 문제 정의와 설명 가능한 로직", "UI 제어는 보안이 아님 — 서버가 최종 방어", "배포도 코드로 관리해야 재현된다", "토큰·컴포넌트 표준화가 협업 속도를 만든다"]),
            ("한계 (정직)", ROSE, ["실수집 크롤러 미구현 — 시드 데이터로 대체", "Gemini 키·TiDB 연결은 운영 설정 필요", "무료 서버 콜드 스타트(최대 1분)", "E2E 테스트 부족 — 단위·API 테스트 중심"]),
            ("다음 단계", MINT, ["실수집 파이프라인 + 스케줄러로 실데이터 전환", "Gemini 문항 생성 · RAG 튜터 · 임베딩 매칭", "TiDB 전환 + 스키마 마이그레이션", "Docker 기반 AWS EC2 병행 배포 · E2E 테스트"])]
    for i, (t, c, items) in enumerate(cols):
        x = 0.6 + i * 4.1
        card(sl, x, 1.75, 3.9, 4.6)
        shape(sl, MSO_SHAPE.RECTANGLE, x, 1.75, 3.9, 0.07, c)
        text(sl, x + 0.25, 2.0, 3.4, 0.4, t, 17, INK, True)
        bullets(sl, x + 0.25, 2.65, 3.45, items, 14, MUTED, 14, c if c != MINT else "0AA57C", 3.6)


def s16(sl):
    text(sl, 0.7, 0.45, 8, 0.3, [[("16", {"color": MINT, "bold": True}), ("   Q&A  ·  LIVE DEMO", {"color": "B8BDE0"})]], 11, bold=True)
    text(sl, 0.7, 0.85, 8, 0.8, "질문을 받겠습니다", 36, WHITE, True)
    demo = [("학습자", "로그인 → 진단 → Pick 로드맵"), ("기업 담당자", "채용 요건 입력 → AI 필수/우대 구조화"), ("테스트 관리자", "수정 시도 → 서버 403 차단 확인")]
    for i, (t, d) in enumerate(demo):
        y = 1.95 + i * 0.85
        card(sl, 0.7, y, 5.6, 0.72, fill="171C4D", line="2F3677", radius=0.12)
        shape(sl, MSO_SHAPE.OVAL, 0.9, y + 0.17, 0.38, 0.38, MINT)
        text(sl, 0.9, y + 0.17, 0.38, 0.38, str(i + 1), 13, INK, True, "c", "m")
        text(sl, 1.5, y + 0.07, 4.7, 0.3, t, 13, WHITE, True)
        text(sl, 1.5, y + 0.38, 4.7, 0.3, d, 10.5, "B8BDE0")
    for i, (url, lab) in enumerate([(SITE, "라이브 데모"), (REPO, "GitHub")]):
        x = 0.7 + i * 2.85
        card(sl, x, 4.6, 2.65, 2.0, fill=WHITE, line=WHITE, radius=0.07)
        picture(sl, qr_png(url), x + 0.1, 4.7, 1.4, 1.4)
        text(sl, x + 1.55, 4.95, 1.05, 0.9, [lab, [("스캔하여", {"size": 9, "color": MUTED, "bold": False})], [("바로 접속", {"size": 9, "color": MUTED, "bold": False})]], 11.5, INK, True, spacing=1.3)
        text(sl, x, 6.2, 2.65, 0.3, url.replace("https://", ""), 8.5, MUTED, align="c")
    qa = [("실데이터인가요?", "수치는 공공 데이터 분포를 모사한 시드. 모델·집계 API는 실동작, 크롤러는 로드맵"),
          ("추천 근거는?", "갭×난이도 보정÷시간 수식. 화면에서 이유 설명"),
          ("읽기 전용 우회는?", "서버 미들웨어 403 + 회귀 테스트"),
          ("배포가 깨지면?", "Actions가 Render 로그 출력, 설정 자동 교정"),
          ("확장성은?", "Docker 기반 → EC2 병행, DB는 TiDB"),
          ("팀 협업은?", "브랜치·PR 리뷰·토큰 기반 디자인")]
    card(sl, 6.7, 1.95, 6.03, 4.65, fill="12163F", line="2A2F63", radius=0.04)
    text(sl, 6.95, 2.08, 5.5, 0.3, "예상 질문 6", 11, MINT, True)
    for i, (q, a) in enumerate(qa):
        y = 2.5 + i * 0.67
        text(sl, 6.95, y, 1.9, 0.6, q, 11, WHITE, True, spacing=1.2)
        text(sl, 8.85, y, 3.75, 0.6, a, 10, "B8BDE0", spacing=1.2)


BUILD = {1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7, 8: s8, 9: s9, 10: s10, 11: s11, 12: s12, 13: s13, 14: s14, 15: s15, 16: s16}
DARK = {1, 6, 7, 13, 16}
TITLES = {1: None, 16: None}


def build_pptx() -> None:
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    blank = prs.slide_layouts[6]
    bg = {True: make_bg(True).getvalue(), False: make_bg(False).getvalue()}
    for n in range(1, TOTAL + 1):
        sl = prs.slides.add_slide(blank)
        dark = n in DARK
        picture(sl, io.BytesIO(bg[dark]), 0, 0, 13.333, 7.5)
        if n not in TITLES:
            header(sl, n, D[n]["title"], dark)
        BUILD[n](sl)
        footer(sl, n, OWNERS[n], dark)
        mm, ss = divmod(D[n]["sec"], 60)
        sl.notes_slide.notes_text_frame.text = f"[목표 {D[n]['sec']}초]\n\n{D[n]['script']}\n\n▶ 면접관 어필 포인트: {D[n]['appeal']}"
    prs.save(OUT_PPTX)


def build_md() -> None:
    total = sum(d["sec"] for d in D.values())
    lines = ["# cognipick 발표 구성안 & 대본", "", f"- 발표자: **김모란** (PM·백엔드) · 팀: 김모란(조장)·박미금·이오리·홍기흥",
             f"- 분량: {TOTAL}장 · 목표 {total // 60}분 {total % 60:02d}초 (질의응답 제외)", f"- 라이브: {SITE} · 저장소: {REPO}",
             "- 슬라이드 파일: `docs/cognipick_발표자료.pptx` (발표자 노트에 동일 대본 포함)",
             "- 디자인: 서비스와 동일한 'Pick Signal' 토큰(인디고·민트·잉크) + 하단 **Skill Metro 진행선**(역=슬라이드)", "",
             "> 정직 원칙: 배포본의 수요 수치는 공공 데이터 분포를 모사한 시드 데이터이며, 실수집 크롤러는 로드맵입니다. 발표에서도 그대로 밝힙니다.", ""]
    t = 0
    for n in range(1, TOTAL + 1):
        d = D[n]
        t += d["sec"]
        lines += [f"## {n}. {d['title']}  _({t // 60}:{t % 60:02d} 누적 · {d['sec']}초)_", "", f"**핵심 시각 자료**: {d['visual']}", "", "**본문**", ""]
        lines += [f"- {b}" for b in d["body"]]
        lines += ["", "**발표자 스크립트**", "", f"> {d['script']}", "", f"**면접관 어필 포인트**: {d['appeal']}", "", "---", ""]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    build_pptx()
    build_md()
    print("saved", OUT_PPTX, OUT_MD)
