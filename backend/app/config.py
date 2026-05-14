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

    cors_origins: str = "http://localhost:5174"

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]
