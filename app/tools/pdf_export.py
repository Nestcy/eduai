"""Printable flashcard PDF generation using ReportLab.

Produces a grid of front/back flashcards (question on one page set,
matching answer on the next) sized for standard index-card printing.
"""
from __future__ import annotations

import os
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.logging_config import logger
from app.models.state import Flashcard

CARD_WIDTH = 3.5 * inch
CARD_HEIGHT = 2.0 * inch
MARGIN = 0.4 * inch
COLS = 2
ROWS = 4


def _draw_card_grid(c: canvas.Canvas, texts: list[str], title_prefix: str) -> None:
    page_width, page_height = letter
    for i, text in enumerate(texts):
        col = i % COLS
        row = (i // COLS) % ROWS
        if i > 0 and i % (COLS * ROWS) == 0:
            c.showPage()
        x = MARGIN + col * (CARD_WIDTH + MARGIN)
        y = page_height - MARGIN - (row + 1) * (CARD_HEIGHT + 0.15 * inch)

        c.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, 6, stroke=1, fill=0)
        c.setFont("Helvetica", 9)
        wrapped = _wrap_text(text, max_chars=48)
        text_y = y + CARD_HEIGHT - 18
        for line in wrapped[:8]:
            c.drawString(x + 10, text_y, line)
            text_y -= 12
    c.showPage()


def _wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 > max_chars:
            lines.append(current)
            current = word
        else:
            current = f"{current} {word}".strip()
    if current:
        lines.append(current)
    return lines


def export_flashcards_to_pdf(
    flashcards: list[Flashcard], output_dir: str, subject: str, topic: str
) -> str:
    """Render `flashcards` as a printable PDF (questions, then answers). Returns file path."""
    os.makedirs(output_dir, exist_ok=True)
    safe_topic = "".join(ch if ch.isalnum() else "_" for ch in topic)
    filename = f"{subject}_{safe_topic}_{datetime.utcnow():%Y%m%d%H%M%S}.pdf"
    path = os.path.join(output_dir, filename)

    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle(f"{subject} Flashcards - {topic}")

    questions = [f"Q: {card.question}" for card in flashcards]
    answers = [f"A: {card.answer}" for card in flashcards]

    _draw_card_grid(c, questions, title_prefix="Q")
    _draw_card_grid(c, answers, title_prefix="A")

    c.save()
    logger.info(f"Exported {len(flashcards)} flashcards to {path}")
    return path
