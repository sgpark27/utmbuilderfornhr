# [PRD] CareerLink 사내용 UTM Builder 개발

## 1. 개요 (Background)
현재 채용 홍보 시 GA4 추적을 위해 구글 공식 UTM Builder를 사용 중이나, 채널별 `source`, `medium` 값을 매번 수동 입력해야 하여 번거로움과 데이터 오입력(오타 등) 리스크가 존재합니다. 이를 **사전에 정의된 채널 프리셋 기반**의 사내 전용 도구로 구축하여 **운영 효율**을 높이고 **데이터 정합성**을 확보하고자 합니다.

---

## 2. 목표 (Objectives)
* **운영 효율화:** 1회 입력으로 다수 채널의 UTM URL 일괄 생성.
* **데이터 표준화:** 정해진 규격(Source/Medium) 외 입력 차단으로 데이터 파편화 방지.
* **UX 단순화:** 실무 운영자가 별도의 가이드 없이도 즉시 사용 가능한 직관적인 UI 제공.

---

## 3. AS-IS vs TO-BE

| 구분 | AS-IS (Google UTM Builder) | TO-BE (CareerLink 전용 빌더) |
| :--- | :--- | :--- |
| **채널 입력** | 매번 `source`, `medium` 직접 타이핑 | 사전에 정의된 채널 테이블에서 **복수 선택** |
| **생성 방식** | URL 1개당 1번씩 생성 작업 반복 | 1개 랜딩 URL 입력으로 **N개 채널용 URL 일괄 생성** |
| **데이터 정합성** | 담당자마다 명칭이 달라 데이터 파편화 | 관리자가 정의한 프리셋으로 **데이터 표준화** |
| **결과 확인** | 화면에 나타난 URL 1개를 복사 | 생성된 리스트를 **표(Table) 형태**로 확인 및 일괄 복사 |

---

## 4. 상세 기능 요구사항 (Functional Requirements)

### F-1. 채널 데이터 프리셋 (Configuration)
* 내부적으로 사용하는 채용 채널을 상수(Constant) 또는 JSON 형태로 관리합니다.
* **관리 대상 데이터 예시:**
    * 사람인: `source=saramin`, `medium=job_portal`
    * 잡코리아: `source=jobkorea`, `medium=job_portal`
    * 링크드인: `source=linkedin`, `medium=sns`
    * 뉴스레터: `source=newsletter`, `medium=email`

### F-2. 사용자 입력 및 선택 (Input UI)
* **Landing URL:** 홍보하고자 하는 최종 목적지 URL (예: CareerLink 공고 상세 페이지).
* **Campaign Name:** 캠페인 식별을 위한 필수값 (예: `2026_spring_recruitment`).
* **Channel Selection:** 프리셋된 채널 리스트를 **체크박스** 형태로 노출하여 중복 선택 가능하게 함.

### F-3. 결과 생성 및 관리 (Output)
* **Dynamic Generation:** 입력 및 선택 값이 변경될 때마다 실시간으로 결과 URL 생성.
* **Result Table:** 선택한 채널명, 생성된 전체 URL, 개별 복사 버튼을 포함한 테이블 노출.
* **Bulk Action:** 생성된 모든 URL을 한 번에 복사하는 '전체 복사' 기능 제공.

---

## 5. UI/UX 가이드라인 (Design)
* **Context:** CareerLink 시스템의 UX 가치를 계승하여 **단순함**을 최우선으로 함.
* **Validation:** Landing URL이 유효한 형식이 아닐 경우 경고 메시지 출력.
* **Feedback:** URL 복사 시 '복사 완료' 토스트 메시지 노출.

---

## 6. 기술 스택 제안 (Tech Stack)
* **Frontend:** React.js / Next.js
* **Styling:** Tailwind CSS
* **Logic:** `URLSearchParams` API를 활용한 파라미터 결합 로직 구현

---