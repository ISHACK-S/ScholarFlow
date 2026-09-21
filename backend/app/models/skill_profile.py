from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SkillProfileItem(BaseModel):
    skill_id: str
    skill_name: str
    subject: str
    description: Optional[str] = None
    score: float = Field(ge=0, le=100)
    is_gap: bool
    last_updated: datetime


class SkillGapResponse(BaseModel):
    subject: str
    threshold: float = Field(ge=0, le=100)
    skills: list[SkillProfileItem]
    gaps: list[SkillProfileItem]


class SkillGapRecomputeResponse(SkillGapResponse):
    recomputed_at: datetime
