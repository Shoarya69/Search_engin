"""GLiNER NLP sidecar for hybrid search (rules + NER)."""
from __future__ import annotations

import os
import re
import time
from functools import lru_cache
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Catalog GLiNER API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("NLP_CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LABELS = [
    "business name",
    "product",
    "product category",
    "business type",
    "location",
    "city",
    "state",
    "area",
    "service",
    "price intent",
]

THRESHOLD = float(os.getenv("GLINER_THRESHOLD", "0.4"))

# category_labels in catalog-data.json. These are categories, not products.
CATEGORIES = (
    "Electronics",
    "Consumer Electronics",
    "Computer",
    "Laptops",
    "Headphones & Speakers",
    "Mobiles",
    "Air Conditioners",
    "Bluetooth Speakers",
    "Wireless earbuds",
    "IT Hardware",
    "Home Appliances",
    "Gifts & Retail",
    "IT Services",
    "Software",
    "Networking",
    "CCTV",
    "Healthcare",
    "Hospitals",
    "Food & Dining",
    "Restaurants",
    "Real Estate",
    "Property Developers",
    "Media Services",
    "Industrial Electronics",
    "Semiconductors",
    "Cables",
    "Audio-Video",
    "IT Products",
    "Toys",
    "Wholesale",
)


def _norm(value: str) -> str:
    text = value.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text).strip()
    return re.sub(r"\b([a-z]{4,})s\b", r"\1", text)


_CATEGORY_BY_NORM = {_norm(label): label for label in CATEGORIES}


def canonical_category(text: str) -> str | None:
    return _CATEGORY_BY_NORM.get(_norm(text))


def correct_entity(text: str, label: str) -> tuple[str, str]:
    """GLiNER often tags a category span as product. Keep the catalog name."""
    category = canonical_category(text)
    if category and label in {"product", "product category", "service"}:
        return category, "product category"
    return text, label


class ParseRequest(BaseModel):
    query: str = Field(min_length=1)


class EntityOut(BaseModel):
    text: str
    label: str
    score: float


class ParseResponse(BaseModel):
    query: str
    entities: list[EntityOut]
    timing_sec: dict[str, float]


@lru_cache(maxsize=1)
def get_model() -> Any:
    from gliner import GLiNER

    return GLiNER.from_pretrained(
        os.getenv("GLINER_MODEL", "gliner-community/gliner_small-v2.5")
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/parse", response_model=ParseResponse)
def parse(req: ParseRequest) -> ParseResponse:
    start = time.perf_counter()
    model = get_model()
    infer_start = time.perf_counter()
    raw = model.predict_entities(req.query, LABELS, threshold=THRESHOLD)
    infer_elapsed = time.perf_counter() - infer_start

    entities: list[EntityOut] = []
    for entity in raw:
        text, label = correct_entity(str(entity["text"]), str(entity["label"]))
        entities.append(
            EntityOut(
                text=text,
                label=label,
                score=round(float(entity["score"]), 3),
            )
        )

    return ParseResponse(
        query=req.query,
        entities=entities,
        timing_sec={
            "inference": round(infer_elapsed, 4),
            "total": round(time.perf_counter() - start, 4),
        },
    )
