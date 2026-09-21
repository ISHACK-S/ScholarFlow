import math
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.database.supabase_client import get_supabase_client


class SkillScoringService:
    def __init__(self, threshold: float | None = None):
        configured_threshold = os.getenv('SKILL_GAP_THRESHOLD', '60')
        self.threshold = threshold if threshold is not None else float(configured_threshold)
        self.client = get_supabase_client()

    @staticmethod
    def _parse_datetime(value: Any) -> datetime:
        if isinstance(value, datetime):
            parsed = value
        elif value:
            parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        else:
            parsed = datetime.now(timezone.utc)

        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)

    @classmethod
    def calculate_proficiency(
        cls,
        attempts: List[Dict[str, Any]],
        now: datetime | None = None,
    ) -> float:
        if not attempts:
            return 0.0

        reference_time = now or datetime.now(timezone.utc)
        if reference_time.tzinfo is None:
            reference_time = reference_time.replace(tzinfo=timezone.utc)

        weighted_score = 0.0
        total_weight = 0.0

        for attempt in attempts:
            percentage = float(attempt.get('percentage', 0) or 0)
            difficulty = float(attempt.get('difficulty_weight', 1) or 1)
            created_at = cls._parse_datetime(attempt.get('created_at'))
            age_days = max((reference_time - created_at).total_seconds() / 86400, 0)
            recency_weight = math.exp(-age_days / 30)
            weight = max(recency_weight * difficulty, 0.01)
            weighted_score += max(min(percentage, 100), 0) * weight
            total_weight += weight

        return round(weighted_score / total_weight, 2) if total_weight else 0.0

    def recompute(self, user_id: str, subject: str = 'Computer Science') -> Dict[str, Any]:
        if self.client is None:
            raise RuntimeError('Supabase is not configured.')

        skills_response = (
            self.client.table('skills')
            .select('id, name, subject, description, weight')
            .eq('subject', subject)
            .execute()
        )
        skills = skills_response.data or []

        attempts_response = (
            self.client.table('quiz_scores')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', desc=True)
            .execute()
        )
        attempts = attempts_response.data or []

        profiles = []
        for skill in skills:
            skill_attempts = [
                attempt
                for attempt in attempts
                if attempt.get('skill_id') == skill.get('id')
            ]
            score = self.calculate_proficiency(skill_attempts)
            profiles.append({
                'user_id': user_id,
                'skill_id': skill['id'],
                'score': score,
                'last_updated': datetime.now(timezone.utc).isoformat(),
            })

        if profiles:
            self.client.table('skill_profile').upsert(
                profiles,
                on_conflict='user_id,skill_id',
            ).execute()

        return {
            'subject': subject,
            'threshold': self.threshold,
            'skills': skills,
            'profiles': profiles,
            'gaps': [profile for profile in profiles if profile['score'] < self.threshold],
            'recomputed_at': datetime.now(timezone.utc),
        }
