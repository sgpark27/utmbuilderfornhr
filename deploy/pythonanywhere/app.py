"""
PythonAnywhere에서 Vite 빌드(dist)를 서빙합니다.
React Router(BrowserRouter)를 위해 존재하지 않는 경로는 index.html로 돌립니다.

채널 목록 중앙 관리(선택):
  환경 변수 UTM_BUILDER_ADMIN_ID / UTM_BUILDER_ADMIN_PASSWORD 를 설정하면
  GET/PUT /api/channel-groups 가 활성화되고, data/channel_groups.json 에 저장됩니다.
  (프론트는 Vite 빌드 시 VITE_CENTRAL_CHANNELS=1 이어야 이 API를 씁니다.)
"""
import json
import os
import hmac

from flask import Flask, jsonify, request, send_from_directory

_HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(_HERE, "dist")
DATA_DIR = os.path.join(_HERE, "data")
CHANNEL_FILE = os.path.join(DATA_DIR, "channel_groups.json")

app = Flask(__name__, static_folder=BASE, static_url_path="")


def _const_eq(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def _admin_ok() -> bool:
    body = request.get_json(silent=True) or {}
    ex_id = os.environ.get("UTM_BUILDER_ADMIN_ID") or ""
    ex_pw = os.environ.get("UTM_BUILDER_ADMIN_PASSWORD") or ""
    if not ex_id or not ex_pw:
        return False
    got_id = (body.get("id") or "").strip()
    got_pw = body.get("password") or ""
    return _const_eq(got_id, ex_id) and _const_eq(got_pw, ex_pw)


@app.route("/api/channel-groups", methods=["GET"])
def get_channel_groups():
    if not os.path.isfile(CHANNEL_FILE):
        return jsonify({"groups": None})
    try:
        with open(CHANNEL_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            return jsonify({"groups": None})
        return jsonify({"groups": data})
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "read_failed"}), 500


@app.route("/api/channel-groups", methods=["PUT"])
def put_channel_groups():
    if not _admin_ok():
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json(silent=True) or {}
    groups = body.get("groups")
    if not isinstance(groups, list):
        return jsonify({"error": "invalid_body"}), 400
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        tmp = CHANNEL_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(groups, f, ensure_ascii=False, indent=0)
        os.replace(tmp, CHANNEL_FILE)
    except OSError:
        return jsonify({"error": "write_failed"}), 500
    return jsonify({"ok": True})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path: str):
    if path:
        candidate = os.path.join(BASE, path)
        if os.path.isfile(candidate):
            return send_from_directory(BASE, path)
    return send_from_directory(BASE, "index.html")
