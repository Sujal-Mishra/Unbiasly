from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = "fallback_key"
    GEMINI_API_KEY_FALLBACK: str = "fallback_key"
    GROQ_API_KEY: str = "fallback_key"
    MODEL_PATH: str = "./app/models/zero_shot"
    
    class Config:
        env_file = ".env"

settings = Settings()
