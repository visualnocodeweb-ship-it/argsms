from datetime import datetime, timezone
from typing import Annotated

from pydantic import PlainSerializer


def ensure_utc(dt: datetime) -> datetime:
    """SQLite suele devolver naive; tratamos naive como UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def to_utc_iso(dt: datetime) -> str:
    return ensure_utc(dt).isoformat().replace("+00:00", "Z")


UtcDateTime = Annotated[datetime, PlainSerializer(to_utc_iso, return_type=str)]
