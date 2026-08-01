from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    secret_key: str = "mensajes-arg-dev-secret-change-me"
    admin_email: str = "admin@mensajesarg.com"
    admin_password: str = "admin123"
    httpsms_api_key: str = ""
    httpsms_base_url: str = "https://api.httpsms.com"
    database_url: str = "sqlite+aiosqlite:///./mensajes_arg.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Link del SMS para Red Comunitaria. En local: IP LAN de la PC (no 127.0.0.1).
    public_app_url: str = "http://127.0.0.1:5173"
    access_token_expire_minutes: int = 60 * 12

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def public_link_base(self) -> str:
        """Base URL del front para links del SMS (debe ser alcanzable desde el celular)."""
        return (self.public_app_url or "http://127.0.0.1:5173").strip().rstrip("/")


settings = Settings()
