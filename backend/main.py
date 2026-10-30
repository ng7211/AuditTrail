from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "OK"}


# Register API routes first so /health always reaches the backend.
frontend_dir = Path(__file__).resolve().parent.parent / "frontend/dist/audittrail/browser"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
