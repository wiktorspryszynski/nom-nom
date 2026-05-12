from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    anthropic_api_key: str
    usda_api_key: str = ""

    cors_origins: list[str] = ["http://localhost:5174"]

    class Config:
        env_file = ".env"


settings = Settings()
