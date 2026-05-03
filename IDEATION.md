# Clipboard Stash (클립보드 보관함)

**생성일**: 2026-04-30
**슬러그**: clipboard-stash
**배치**: afternoon #2

## 한 줄 요약
Win+V를 정면 대체하는 6MB Tauri 데스크톱 앱 — 무제한 클립보드 히스토리, 글로벌 핫키 검색, 정규식·태그·핀고정, 스니펫 변수 치환({date}/{clipboard}/{cursor}), 비밀번호 매니저 자동 제외까지 한 번에 갖춘 한국어 우선 Windows 생산성 도구.

## 타겟 사용자
- **개발자**: 코드 스니펫 반복 붙여넣기 (boilerplate, regex, SQL, JSON)
- **작가·번역가·고객지원 CS**: 자주 쓰는 문구·답변 템플릿 보관
- **사무직 파워유저**: 엑셀 수식·이메일 서명·고객 응대 메시지
- **디자이너·기획자**: HEX 색상·치수·UX 라이팅 카피 보관

## 핵심 기능 (MVP)
1. **영구 히스토리**: SQLite에 무제한 저장(텍스트·이미지·파일경로). 시간·앱 출처·문자수 메타.
2. **글로벌 핫키 팝업**: `Ctrl+Shift+V` 어디서든 검색창 호출, 화살표↑↓+Enter로 즉시 붙여넣기.
3. **정규식·태그·핀고정**: `regex:\d{4}-\d{2}-\d{2}` 같은 검색 + 사용자 태그 + 상위 9개 핀(1~9 키).
4. **스니펫 + 변수 치환**: 즐겨찾기 스니펫에 `{date}`, `{time}`, `{clipboard}`, `{cursor}` 변수 — 붙여넣을 때 실시간 치환.
5. **자동 제외(privacy)**: 비밀번호 매니저(1Password, Bitwarden, Chrome AutoFill) 출처는 히스토리에 안 남김. 신용카드 번호 패턴 16자리 자동 마스킹.

## 차별화 포인트
1. **가격 갭**: Paste $9.99/월(연 ₩140K), Alfred Powerpack £39, Ditto·CopyQ는 무료지만 UI 구식·한글 안 맞음 → **Clipboard Stash 일회성 ₩19,000** 가 시장 빈자리.
2. **Tauri 6MB**: Electron 기반 경쟁자(Magnet 등)는 80~120MB·RAM 200MB+ → Tauri로 6~8MB·idle 30MB. 시스템 트레이만 띄워도 부담 0.
3. **한국어 IME 친화**: 두벌식·세벌식 한글 검색에서 자모 분해·결합 정확 매칭. 영문 도구는 "ㅎ" 입력 시 "ha"로 잘못 해석.
4. **개발자 워크플로우**: VS Code/Cursor/IntelliJ 활성 창 감지 → 코드 청크는 자동 syntax highlight + 언어 추정.

## 기술 스택
- **프레임워크**: Tauri 2.x (Rust 코어 + React WebView UI)
- **프론트**: React 18 + TypeScript + Vite + ToolFunHub 디자인 토큰(`--primary: #6366f1`, Pretendard, `.card`, `.btn-primary`)
- **백엔드(Rust)**: `arboard`(클립보드 읽기) + `tauri-plugin-global-shortcut`(핫키) + `tauri-plugin-sql`(SQLite) + `enigo`(자동 붙여넣기)
- **DB**: SQLite (로컬, 사용자 `%APPDATA%/clipboard-stash/store.db`)
- **외부 API**: 0 (완전 오프라인). 업데이트 체크는 Phase 2.

## 수익 모델

### 옵션 A. 일회성 라이선스 (Lemon Squeezy)
- 가격: **₩19,000 평생 라이선스** (3대 PC 키)
- TAM: 한국 개발자·디자이너 약 100만 명, 그중 1% 인지·0.3% 결제 가정 → 약 3,000명 × ₩19K = ₩5,700만 (런웨이 1년)
- 무료 limit: 히스토리 100개 / 스니펫 5개 / 핀 3개. Pro: 무제한.
- 진입장벽: 낮음 (Lemon Squeezy 한국 결제 지원, VAT 자동)
- 경쟁서비스: Paste(고가 구독), Alfred(Mac만), Ditto(무료지만 UI 구식·한글 약함), Win+V 기본(검색 X·14개 한정)

### 옵션 B. GitHub Sponsors + Pro 라이선스 듀얼
- 무료 OSS 코어(MIT) → 인지도 확보
- Pro 기능: 클라우드 동기(E2E), 팀 공유 스니펫, 업데이트 우선
- TAM: 글로벌 개발자 GitHub Sponsors 평균 월 $50~200, Pro 라이선스가 본 매출
- 진입장벽: 중간 (E2E 동기 인프라 필요)

### 옵션 C. (장기) B2B 팀 라이선스
- 콜센터·CS팀 응대 템플릿 공유 라이선스 ₩5,000/시트/월
- TAM: 한국 콜센터 약 40만 좌석, 그중 0.5% × ₩5K × 12 = ₩1.2억/년 가능
- 진입장벽: 높음 (팀 공유 인프라·관리자 콘솔 필요) → Phase 4

## 선정 근거

이번 배치(afternoon #2)에서 검토한 3개 아이디어:

| 후보 | 실용성 | MVP | 차별화 | 수익 | 재미 | 총합 |
|---|---|---|---|---|---|---|
| A. shortcut-dojo (PWA 단축키 학습) | 5 | 4 | 4 | 3 | 4 | 20 |
| B. stock-snap (PWA 자영업 재고) | 4 | 3 | 4 | 5 | 2 | 18 |
| **C. clipboard-stash (Tauri 데스크톱)** | **5** | **3** | **5** | **5** | **3** | **21** |

**clipboard-stash 선정 이유**:
- **차별화 5점**: Tauri 6MB·한국어 IME·일회성 가격대가 모두 시장 빈자리 — 외산 경쟁자(Paste·Ditto·Win+V) 어느 곳도 동시에 못 채움.
- **수익 5점**: 개발자 도구 일회성 라이선스는 Lemon Squeezy로 검증된 매출 모델(예: Bear·Things·Soulver). $15~20 가격대가 가장 거부감 적음.
- **오늘 믹스 보강**: 오전 3건이 모두 정적 SPA, 오후 #1이 Node CLI → **Tauri 데스크톱 네이티브** 가 추가되어 기술스택·OS 노출면 다양화.
- **트렌드 부합**: Tauri 2.x GitHub 리포 YoY +55%, "Electron→Tauri 전환" 사례 다수 (검색 결과 인용).
- **MVP 3점(약점)**: Tauri 빌드·Rust 학습곡선이 정적 SPA보다 깊지만, Tauri 공식 템플릿 + 플러그인 3개(`global-shortcut`, `sql`, `clipboard`)면 1차 뼈대는 가능.

## 오늘 트렌드 근거
1. **Tauri 데스크톱 트렌드**: "Tauri 2.x with mobile support and Electron 34.x maturing — choice never more consequential. Tauri repos +55% YoY, productivity app team switched and installer dropped 120MB→8MB." [Tauri vs Electron 2026](https://tech-insider.org/tauri-vs-electron-2026/)
2. **Stack Overflow 2025**: "72% of desktop developers considered switching frameworks; performance & bundle size top reasons." [Tauri 2026 DEV Community](https://dev.to/ottoaria/tauri-in-2026-build-cross-platform-desktop-apps-with-web-technologies-better-than-electron-11mo)
3. **클립보드 매니저 시장 검증**: Paste $9.99/월 구독이 인기 → 가격 저항 있는 한국 시장에 일회성 ₩19K 빈자리.

## 외부 의존성·리스크
- **Tauri 빌드 환경**: Rust toolchain + WebView2 (Win11 기본 포함, Win10은 자동 다운로드). Phase 1 빌드 산출물은 `.exe` (코드사이닝 X — "알 수 없는 게시자" 경고 → README에 안내).
- **글로벌 핫키 충돌**: Win+V 기본·QQ 메신저 등과 충돌 가능 → 사용자 변경 가능 + 첫 실행 시 충돌 검사.
- **자동 붙여넣기(enigo)**: 일부 보안 SW(V3·알약)가 키 시뮬레이션 차단 가능 → 클립보드 복사만으로 폴백.
- **SQLite 성능**: 100만 건 시 검색 200ms+ → FTS5 인덱스 도입(Phase 2).
- **저작권·라이선스**: arboard, enigo 모두 MIT/Apache → 상용 OK. ToolFunHub 디자인 토큰은 자체 자산.
- **목업 가능 영역**: 1차 MVP는 코드사이닝·자동업데이터·아이콘 polish 생략. 핵심 워크플로우(클립보드 캡처 → SQLite → 핫키 검색 → 붙여넣기)만 검증.

## 디자인 통합 규칙 준수
- WebView 내 React UI에 **ToolFunHub 디자인 토큰** 그대로 적용:
  - `--primary: #6366f1`, `--bg`, `--card`, `--text`, `--border`
  - `.card` / `.btn-primary` / `.btn-secondary` / `.input` 컨벤션
  - Pretendard 폰트 (Tauri는 시스템 폰트 폴백 가능)
  - 다크모드 토글 (`tfh_theme` localStorage 호환)
- 추후 ToolFunHub 흡수 가능성 (웹 데모 페이지 → "Pro 기능은 데스크톱 앱에서" 유도)
