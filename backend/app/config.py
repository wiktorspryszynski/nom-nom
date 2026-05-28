from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_user: str
    postgres_password: str
    postgres_db: str = "nomnom"
    postgres_host: str = "db"
    postgres_port: int = 5432

    @computed_field
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    anthropic_api_key: str | None = None
    usda_api_key: str = ""
    ai_calls_per_user_per_day: int = 50
    demo_ai_call_limit: int = 15  # lifetime cap for demo accounts (never resets)

    cors_origins: str = "http://localhost:5174"

    # GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = ""  # e.g. https://fit.spryszynski.pl/auth/github/callback

    # Email notifications for demo requests (optional — leave empty to skip)
    smtp_host: str = ""
    smtp_port: int = 465
    smtp_user: str = ""
    smtp_password: str = ""
    notify_email: str = ""

    @computed_field
    @property
    def ai_available(self) -> bool:
        return bool(self.anthropic_api_key)

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]
