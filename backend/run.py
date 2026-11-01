import uvicorn

if __name__ == "__main__":
    from app.seed import run as seed
    seed()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
