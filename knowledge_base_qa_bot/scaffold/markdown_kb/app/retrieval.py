import os

from langchain.schema import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from . import indexer


SYSTEM_PROMPT = """
You are a knowledge-base Q&A assistant. Your job is to answer questions using only the information provided in the CONTEXT below.

Rules:
- Answer ONLY using facts present in the CONTEXT. Do not use outside knowledge.
- Every factual claim must be supported by a [Source: filename#heading] tag from the context.
- Keep answers concise: 1-3 sentences for short factual queries.
- Do NOT guess, infer beyond what is stated, or invent source IDs.
- If the context does not contain enough information to answer the question, reply exactly: "I cannot confirm from the knowledge base."
- Do not fabricate or paraphrase source IDs — cite them exactly as they appear in [Source: ...] tags.
"""

_llm = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            request_timeout=20,
            max_retries=1,
        )
    return _llm


def build_prompt(query: str, ranked_sections: list) -> str:
    lines = ["CONTEXT:", ""]
    for section, _score in ranked_sections:
        path = " > ".join(section.heading_path)
        lines.append(f"[Source: {section.id}] (path: {path})")
        lines.append(section.content)
        lines.append("")
    lines.append("QUESTION:")
    lines.append(query)
    return "\n".join(lines)


NOT_INDEXED_MSG = "The knowledge base has not been indexed yet. Call POST /index first."
CANNOT_CONFIRM_MSG = "I cannot confirm from the knowledge base."


def build_sources(ranked_sections: list) -> list[dict]:
    return [
        {
            "source": section.id,
            "heading": " > ".join(section.heading_path),
            "score": round(score, 3),
            "content": section.content[:240],
        }
        for section, score in ranked_sections
    ]


def query(question: str) -> dict:
    if not indexer.sections:
        return {"answer": NOT_INDEXED_MSG, "sources": []}

    ranked_sections = indexer.search(question, k=3)
    if not ranked_sections:
        return {"answer": CANNOT_CONFIRM_MSG, "sources": []}

    response = get_llm().invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=build_prompt(question, ranked_sections)),
    ])

    return {
        "answer": response.content,
        "sources": build_sources(ranked_sections),
    }


def stream_query(question: str):
    """Yield (event, data) tuples for SSE: sources -> token* -> done (or error)."""
    if not indexer.sections:
        yield ("sources", {"sources": []})
        yield ("token", {"text": NOT_INDEXED_MSG})
        yield ("done", {"finish_reason": "not_indexed"})
        return

    ranked_sections = indexer.search(question, k=3)
    yield ("sources", {"sources": build_sources(ranked_sections)})

    if not ranked_sections:
        yield ("token", {"text": CANNOT_CONFIRM_MSG})
        yield ("done", {"finish_reason": "no_match"})
        return

    try:
        for chunk in get_llm().stream([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=build_prompt(question, ranked_sections)),
        ]):
            if chunk.content:
                yield ("token", {"text": chunk.content})
    except Exception as exc:  # surface LLM/transport errors to the client
        yield ("error", {"message": str(exc)})
        return

    yield ("done", {"finish_reason": "stop"})
