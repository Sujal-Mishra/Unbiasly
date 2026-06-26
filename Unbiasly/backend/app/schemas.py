from pydantic import BaseModel, Field
from typing import List

class AnalyzeRequest(BaseModel):
    text: str = Field(..., example="The media always manipulates public perception in favor of one ideology.")

class SemanticVectors(BaseModel):
    loaded_language: int
    identity_bias: int
    emotional_framing: int
    toxicity_risk: int

class HeatmapToken(BaseModel):
    word: str
    score: float
    label: str

class SentenceVector(BaseModel):
    sentence: str
    bias_type: str

class AnalyzeResponse(BaseModel):
    bias_detected: bool
    overall_score: int
    risk_level: str
    semantic_vectors: SemanticVectors
    model_interpretation: str
    attention_heatmap: List[HeatmapToken]
    sentence_vector: SentenceVector
    neutral_rewrite: str
