================================================================================
CareerLink UTM Builder → PythonAnywhere 배포 요약
================================================================================

[로컬에서 할 일]

1) 관리자 계정을 빌드에 넣기 (선택이 아니라 쓰려면 필수)
   PowerShell 예:
     $env:VITE_ADMIN_ID="관리자아이디"
     $env:VITE_ADMIN_PASSWORD="비밀번호"
   그다음:
     npm ci
     npm run build

   → dist 폴더가 생깁니다. 이 안의 파일이 전부 프론트 배포본입니다.

2) PythonAnywhere에 올릴 파일 준비
   한 폴더(예: mysite)에 다음만 모읍니다:

     mysite/
       app.py              ← 이 디렉터리의 app.py 복사
       dist/               ← dist 안의 index.html, assets/ 등 전부
       requirements.txt    ← 프로젝트 루트의 requirements.txt 복사

   node_modules, src 등은 서버에 올릴 필요 없습니다.


[PythonAnywhere에서 할 일]

3) Files 탭에서 위 mysite 폴더를 홈 디렉터리 아래에 만든 뒤,
   app.py, requirements.txt, dist/ 를 업로드합니다.

4) Bash 콘솔에서 가상환경 + Flask 설치 (경로는 본인 계정에 맞게):

     cd ~/mysite
     mkvirtualenv --python=/usr/bin/python3.10 venv
     workon venv
     pip install -r requirements.txt

   (Python 버전은 Web 탭에서 고른 버전과 맞추면 됩니다.)

5) Web 탭 → Add a new web app → Manual configuration → Python 버전 선택.

6) Virtualenv 경로에 위에서 만든 venv를 지정합니다.
   예: /home/본인사용자명/.virtualenvs/venv

7) WSGI configuration file 을 열고 내용을 대부분 지운 뒤, 아래만 넣습니다.
   경로 /home/본인사용자명/mysite 는 본인 경로로 바꿉니다.

----- WSGI 파일 예시 -----
import sys
path = "/home/본인사용자명/mysite"
if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
---------------------------

8) Web 탭 맨 위에서 Reload 를 누릅니다.

9) 브라우저에서 https://본인사용자명.pythonanywhere.com
   /admin 으로 직접 들어가도 되는지 확인합니다.


[주의]

- 비밀번호는 Vite 빌드 시 번들에 포함됩니다. 공개 URL이면 노출에 유의하세요.
- 코드를 수정한 뒤에는 로컬에서 다시 npm run build 하고 dist 만 다시 업로드하면 됩니다.

================================================================================
