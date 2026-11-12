"""GLiNER NLP sidecar for hybrid search (rules + NER)."""
from __future__ import annotations

import os
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

    entities = [
        EntityOut(
            text=str(e["text"]),
            label=str(e["label"]),
            score=round(float(e["score"]), 3),
        )
        for e in raw
    ]

    return ParseResponse(
        query=req.query,
        entities=entities,
        timing_sec={
            "inference": round(infer_elapsed, 4),
            "total": round(time.perf_counter() - start, 4),
        },
    )
