import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = ROOT_DIR / "backend" / "storage"
load_dotenv(ROOT_DIR / ".env")

DEFAULT_CORS = "http://localhost:5173,https://cognipick.netlify.app,https://cognipick.onrender.com"


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    def __init__(self) -> None:
        self.app_env = os.getenv("APP_ENV", "development")
        self.jwt_secret_key = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or "dev-secret-change-me"
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))
        self.database_url = os.getenv("DATABASE_URL") or f"sqlite:///{(STORAGE_DIR / 'cognipick.db').as_posix()}"
        if "USER:PASS@HOST" in self.database_url.upper():
            import logging
            logging.getLogger("cognipick").warning("DATABASE_URL 이 예시(플레이스홀더) 값입니다. SQLite 로 대체합니다. 실제 TiDB 주소로 교체하세요.")
            self.database_url = f"sqlite:///{(STORAGE_DIR / 'cognipick.db').as_posix()}"
        self.db_ssl = _bool("DB_SSL", True)
        self.cors_origins = [o.strip().rstrip("/") for o in (os.getenv("CORS_ORIGINS") or DEFAULT_CORS).split(",") if o.strip()]
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        self.backend_public_url = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000").rstrip("/")
        self.admin_secret_key = os.getenv("ADMIN_SECRET_KEY", "")
        self.admin_email = os.getenv("ADMIN_EMAIL", "admin@cognipick.dev")
        self.enable_test_login = _bool("ENABLE_TEST_LOGIN", True)
        self.test_password = os.getenv("TEST_USER_PASSWORD") or "Cogni!Pick2026"
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.oauth = {p: (os.getenv(f"{p.upper()}_CLIENT_ID", ""), os.getenv(f"{p.upper()}_CLIENT_SECRET", ""))
                      for p in ("google", "naver", "kakao")}

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
