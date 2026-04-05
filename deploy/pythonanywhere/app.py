"""
PythonAnywhere에서 Vite 빌드(dist)를 서빙합니다.
React Router(BrowserRouter)를 위해 존재하지 않는 경로는 index.html로 돌립니다.

서버 디렉터리 예시:
  my_project/
    app.py          ← 이 파일
    dist/           ← npm run build 결과 전체
    requirements.txt
"""
import os

from flask import Flask, send_from_directory

_HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(_HERE, "dist")

app = Flask(__name__, static_folder=BASE, static_url_path="")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path: str):
    if path:
        candidate = os.path.join(BASE, path)
        if os.path.isfile(candidate):
            return send_from_directory(BASE, path)
    return send_from_directory(BASE, "index.html")
