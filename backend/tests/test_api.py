def test_health_and_courses(client):
    assert client.get("/health").json() == {"status": "ok"}
    assert len(client.get("/api/courses").json()) >= 10


def test_password_rule(client):
    r = client.post("/api/auth/register", json={"email": "a@b.co", "name": "a", "password": "weakpass"})
    assert r.status_code == 422
    ok = client.post("/api/auth/register", json={"email": "new@b.co", "name": "n", "password": "Str0ng!Pass"})
    assert ok.status_code == 200 and ok.json()["user"]["role"] == "learner"


def test_admin_login_requires_key(client):
    assert client.post("/api/auth/admin-login", json={"key": "wrong"}).status_code == 401


def test_readonly_admin_can_read_not_write(client, readonly, admin):
    assert client.get("/api/admin/users", headers=readonly).status_code == 200
    assert client.get("/api/admin/monitoring", headers=readonly).status_code == 200
    body = {"title": "새 강의", "instructor": "강사"}
    r = client.post("/api/admin/courses", json=body, headers=readonly)
    assert r.status_code == 403 and r.json()["read_only"] is True
    assert client.delete("/api/admin/courses/1", headers=readonly).status_code == 403
    assert client.post("/api/admin/courses", json=body, headers=admin).status_code == 200


def test_learner_cannot_open_admin(client, learner):
    assert client.get("/api/admin/users", headers=learner).status_code == 403


def test_demand_overview_filters(client):
    all_ = client.get("/api/demand/overview").json()
    one = client.get("/api/demand/overview", params={"job": "AI/ML 엔지니어", "region": "서울"}).json()
    assert all_["top_skills"] and one["trends"] and len(one["months"]) == 12


def test_company_structuring(client, company, learner):
    body = {"job": "백엔드 개발자", "requirements": "FastAPI와 Docker 경험 필수, AWS 우대, 경력 2년 이상"}
    assert client.post("/api/demand/posts", json=body, headers=learner).status_code == 403
    s = client.post("/api/demand/posts", json=body, headers=company).json()["structured"]
    assert "FastAPI" in s["must"] and "AWS" in s["nice"]


def test_diagnosis_and_recommend(client, learner):
    qs = client.get("/api/diagnosis/questions", params={"job": "데이터 분석가"}).json()["questions"]
    answers = [{"skill": q["skill"], "choice": 1, "confidence": 2} for q in qs]
    d = client.post("/api/diagnosis/submit", json={"job": "데이터 분석가", "answers": answers}, headers=learner).json()
    assert d["gaps"] and 0 <= d["readiness"] <= 100
    rec = client.get("/api/recommend", params={"job": "데이터 분석가"}, headers=learner).json()
    assert rec["diagnosed"] and rec["picks"] and rec["stages"]


def test_tutor_streams_with_sources(client, learner):
    r = client.post("/api/tutor/chat", json={"message": "SQL JOIN 어떻게 공부하죠?"}, headers=learner)
    assert "sources" in r.text and "[DONE]" in r.text
