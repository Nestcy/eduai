"""Application-wide structured logging via loguru.

Import `logger` from this module anywhere instead of using the stdlib
`logging` module directly, so log format/sinks stay consistent.
"""
import sys
from loguru import logger

from app.config import get_settings


def configure_logging() -> None:
    """Configure loguru sinks. Call once at application startup."""
    settings = get_settings()
    logger.remove()
    logger.add(
        sys.stdout,
        level=settings.log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}:{function}:{line}</cyan> - <level>{message}</level>"
        ),
        backtrace=False,
        diagnose=settings.app_env == "development",
    )
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="14 days",
        level="INFO",
        enqueue=True,
    )


__all__ = ["logger", "configure_logging"]
