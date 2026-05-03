# 로드맵: Clipboard Stash

> MVP 완료 후 정식 제품까지 가는 길. 각 항목은 체크박스로 진행 추적, 공수는 1인 기준 일수.
> 현재 상태: 웹 데모(React+Vite) 합격 / Tauri 스켈레톤은 Rust 미빌드 단계.

---

## Phase 2 — 완성도 (MVP의 빈틈 메우기)

목표: Rust 빌드가 실제로 통과하고, 글로벌 핫키·자동 폴링·자동 붙여넣기·SQLite FTS5 까지 데스크톱 핵심 워크플로우가 로컬에서 끝까지 동작.

### 2.1 QC 발견 이슈 (Rust 빌드 블로커 + 웹 결함)

- [ ] `src-tauri/icons/` 에 실제 1024x1024 PNG 1장 + `cargo tauri icon` 으로 6종(32/128/icon.ico/icon.icns/StoreLogo 등) 자동 생성 — 0.5d
- [ ] `@tauri-apps/api` 의존성 추가 + `src/lib/tauri-bridge.ts` IPC 모듈 신규 작성 (`invoke('history_search')`, `invoke('history_insert')`, `invoke('snippet_paste')` 등 4~6 커맨드 래핑) — 1d
- [ ] `vite.config.ts` `build.sourcemap: false` 로 production `.js.map` 노출 차단 — 0.2d
- [ ] jamo 검색 하이라이트 인덱스 매핑 정확화 (마스킹 후 텍스트 ↔ 원문 인덱스 매핑 테이블 lib/jamo.ts 에 추가) — 1d
- [ ] `npm run tauri` 스크립트 메시지에 "Rust 설치 후 `cargo tauri dev` 직접 실행" 가이드 추가 — 0.2d
- [ ] README "데스크톱 빌드 가이드" 보강 (실패 케이스 5종: WebView2 미설치 / VS Build Tools 누락 / 아이콘 부재 / cargo cache 손상 / EDGE Chromium 충돌) — 0.5d

### 2.2 Tauri 데스크톱 핵심 기능 (MVP에서 빠진 1순위)

- [ ] `cargo tauri build` 1회 dry-run 통과 + .msi/.nsis 산출물 확인 (사용자 환경 가정 위에서 작성자가 직접 실행) — 1d
- [ ] 글로벌 핫키 `Ctrl+Shift+V` 등록 + 충돌 시 fallback (`Ctrl+Alt+V`) 자동 안내 모달 — 1d
- [ ] arboard 30ms 폴링 → SQLite insert 루프 검증 + 중복 텍스트 dedupe 로직 (`hotkey.rs`/`clipboard.rs` 통합 테스트) — 1d
- [ ] SQLite + FTS5 인덱스 구현 (`db.rs` 의 plan 주석을 실제 마이그레이션 코드로, history/snippets/pins 3 테이블 + FTS5 virtual table) — 2d
- [ ] localStorage → SQLite 마이그레이션 스크립트 (첫 Tauri 실행 시 webview localStorage 읽어 옮김) — 0.5d
- [ ] enigo 자동 붙여넣기 + 보안 SW(V3·알약) 차단 감지 시 클립보드만 복사하는 폴백 — 1d
- [ ] 1Password / Bitwarden / KeePassXC / Chrome AutoFill 활성 윈도우 메타(`GetForegroundWindow` + `GetWindowTextW`) 감지 → 히스토리 자동 제외 (제외 앱 목록 사용자 편집 가능) — 1.5d
- [ ] 신용카드 16자리 / 주민번호 / API 키 패턴 자동 마스킹 (저장 시점 옵션 + 표시 시점 옵션 분리) — 0.5d

### 2.3 UX·반응형·빈 상태

- [ ] 빈 상태 UI 3종 (히스토리 없음 / 검색 결과 없음 / regex 컴파일 에러) — 0.5d
- [ ] 360px ~ 1280px 반응형 점검 (트레이 팝업 720x540 고정 모드 + 일반 윈도우 모드 분기) — 0.5d
- [ ] 첫 실행 온보딩 3-step (핫키 안내 → 권한 동의 → 시드 데이터 선택) — 1d
- [ ] 다크모드 토글 시 트레이 아이콘 자동 흑백 반전 — 0.3d

### 2.4 기본 품질

- [ ] Vitest 단위 테스트 5개 (search.ts 3-mode / jamo.ts 자모 / snippets.ts 변수 치환 / mask.ts PII / store.ts prefix) — 1d
- [ ] Rust 단위 테스트 3개 (db CRUD / clipboard dedupe / paste fallback) — 1d
- [ ] Sentry (무료 티어) 프론트 + Rust panic hook — 0.5d
- [ ] Lighthouse 접근성 80+ (대비비·키보드 포커스·aria-label) — 0.5d

**Phase 2 예상 기간**: 16.7d

---

## Phase 3 — 배포

목표: GitHub Releases 에서 .msi 다운로드 가능 + ToolFunHub 웹 데모 흡수 + 한국 커뮤니티 첫 노출.

### 3.1 배포 준비물

- [ ] 도메인 `clipboardstash.app` 또는 `clipboard-stash.toolfunhub.com` 서브도메인 결정 — 0.2d
- [ ] 개인정보처리방침·이용약관 페이지 (Lemon Squeezy 템플릿 한국어 변환) — 0.5d
- [ ] 다운로드 페이지 `/download` 정적 (Win11/Win10 분기 + .msi/.nsis 선택 + 체크섬 표기) — 0.5d
- [ ] 404·500 에러 페이지 (Tauri 윈도우 + 다운로드 페이지 양쪽) — 0.3d
- [ ] favicon·OG 이미지 실제 디자인 (1200x630 + 트레이 16x16/32x32) — 0.5d

### 3.2 Windows 인스톨러 빌드 + 자동 업데이트

- [ ] GitHub Actions 워크플로 `.github/workflows/release.yml` (windows-latest 러너, tag push 트리거, .msi/.nsis 양산) — 1d
- [ ] 코드사이닝 — 1차는 self-signed cert + SmartScreen 우회 안내 README 섹션, 2차는 EV cert 구매 (₩50만~80만) 후 재서명 — 1d
- [ ] Tauri Updater 통합 (`tauri-plugin-updater` + GitHub Releases `latest.json` manifest 자동 생성) — 1d
- [ ] 업데이트 알림 트레이 토스트 + "지금 업데이트 / 다음에" 분기 — 0.5d
- [ ] 배포 후 실사용 스모크 테스트 체크리스트 12항목 (트레이 기동 / 핫키 / 폴링 / 마이그레이션 / 업데이트 검사 등) — 0.5d

### 3.3 ToolFunHub 통합

- [ ] React 빌드 산출물(`dist/`) 을 `frontend/clipboard-stash-service/` 로 복사 + ToolFunHub `tools.js` 에 카드 등록 — 0.5d
- [ ] 웹 데모 상단 배너 "Pro 기능(글로벌 핫키·SQLite 무제한)은 데스크톱 앱" CTA + 다운로드 버튼 — 0.3d
- [ ] hub 흡수 시점에 `tfh_clipboard-stash_*` localStorage 키 충돌 검증 (다른 도구와 prefix 격리 재확인) — 0.3d

### 3.4 영문화 + 마케팅

- [ ] `README.en.md` 영문 분리 (Tauri 글로벌 노출용) — 0.5d
- [ ] 사용자 가이드 영상 1~2분 (한글 자막 + 영문 자막, OBS 녹화 → YouTube 비공개 우선) — 1d
- [ ] velog / OKKY / 인프런 커뮤니티 introduction post 3종 (각 800~1500자 + 스크린샷 4장) — 1d
- [ ] Product Hunt "Coming soon" 페이지 등록 — 0.3d

### 3.5 분석·모니터링

- [ ] Plausible (privacy-friendly) 또는 GA4 다운로드 페이지에만 — 0.3d
- [ ] GitHub Releases 다운로드 카운트 + Sentry 에러 대시보드 통합 뷰 (Notion 대시보드) — 0.5d

**Phase 3 예상 기간**: 9.3d

---

## Phase 4 — 수익화

목표: Lemon Squeezy 라이선스 키 발급·검증 + 무료/Pro 게이팅 + 첫 매출.

IDEATION.md 옵션 A(일회성) 우선 + 옵션 B(Sponsors 듀얼) 후속 + 옵션 C(B2B) 후반.

### 4.1 옵션 A — Lemon Squeezy 일회성 ₩19,000 라이선스

- [ ] Lemon Squeezy 스토어 개설 + Clipboard Stash 상품 등록 (₩19,000, VAT 포함, 한국 결제 PG 자동) — 0.5d
- [ ] 라이선스 키 발급·검증 API 연동 (`POST /v1/licenses/activate`, `validate`, `deactivate`) — 1d
- [ ] 3대 PC 키 검증 (machine_id = WMI BIOS UUID 해시) + offline 7일 grace 로직 — 1.5d
- [ ] 인앱 라이선스 키 입력 UI + 활성화/비활성화 버튼 + "남은 기기 N/3" 표시 — 1d
- [ ] 결제 성공 webhook → 이메일로 라이선스 키 자동 발송 (Lemon Squeezy 기본 템플릿 한국어화) — 0.5d
- [ ] 환불 / 라이선스 회수 흐름 + 사용자 통보 — 0.5d
- [ ] 가격 정책 페이지 `/pricing` (무료 vs Pro 비교 표) — 0.5d

### 4.2 무료 ↔ Pro 기능 게이팅

- [ ] 무료 limit 적용: 히스토리 100개 / 스니펫 5개 / 핀 3개 (limit 초과 시 "Pro로 업그레이드" 모달) — 1d
- [ ] Pro 전용 기능 분기: 무제한 히스토리 / 무제한 스니펫 / 정규식 검색 / regex 자모 / 클라우드 동기(준비) — 1d
- [ ] 7일 Pro 무료 체험 자동 활성 (첫 실행 후 7일) → 만료 안내 모달 — 0.5d

### 4.3 옵션 B — GitHub Sponsors + Pro 클라우드 동기

- [ ] GitHub Sponsors 배지 추가 + README 후원 섹션 (월 $3/$10/$30 티어) — 0.3d
- [ ] Pro 클라우드 동기 E2E 암호화 설계 (사용자 master password 기반 AES-256-GCM, Cloudflare R2 저장) — 2d
- [ ] 동기 charge: Pro 라이선스 보유자 무료 / 비보유자 ₩2,900/월 옵션 — 1d
- [ ] 다중 PC 자동 동기 + 충돌 해결(LWW) — 1.5d

### 4.4 옵션 C — B2B 팀 라이선스 (Phase 4 후반)

- [ ] 팀 워크스페이스 데이터 모델 (admin / member / shared snippets) — 1.5d
- [ ] 시트당 ₩5,000/월 청구 (Lemon Squeezy 구독 + 시트 수 동기) — 1d
- [ ] 관리자 콘솔 `/admin` (시트 추가·제거 / 공유 스니펫 CRUD / 사용 통계) — 2d
- [ ] 콜센터·CS팀 1곳 베타 도입 (5~10시트 무료 3개월 PoC) — 관찰

### 4.5 분석·추천 프로그램

- [ ] 사용자 분석 opt-in 토글 (privacy-friendly, anonymous funnel: install→first_use→day7→pro_upgrade) — 0.5d
- [ ] 추천 프로그램: 사용자가 친구 1명 추천 활성화 시 양쪽 모두 1개월 Pro 무료 (Lemon Squeezy discount code 자동 발급) — 1.5d
- [ ] 분석 대시보드 (Notion + Plausible + Lemon Squeezy 매출 통합) — 0.5d

**Phase 4 예상 기간**: 18.8d

---

## 전체 일정 요약

| Phase | 기간 | 누적 | 주요 산출 |
|---|---|---|---|
| Phase 2 — 완성도 | 16.7d | 16.7d | Rust 빌드 통과, 글로벌 핫키, SQLite FTS5, 자동 폴링/붙여넣기, 비번 매니저 제외 |
| Phase 3 — 배포 | 9.3d | 26.0d | GitHub Actions .msi 자동 빌드, Tauri Updater, ToolFunHub 흡수, 영문 README, 가이드 영상 |
| Phase 4 — 수익화 | 18.8d | 44.8d | Lemon Squeezy 라이선스 + 무료/Pro 게이팅 + 클라우드 동기 + B2B + 추천 프로그램 |

**총 예상 기간**: 44.8d (1인 기준, 약 9주)

---

## 성공 지표 (출시 후 3개월)

- **다운로드 5,000회** (.msi GitHub Releases 다운로드 카운트 기준)
- **MAU 1,500명** (Plausible 또는 자체 anonymous 핑)
- **유료 전환율 2%** = 약 30명 × ₩19,000 = ₩57만 (3개월 누적 ₩170만)
- **GitHub Star 500개** (Tauri 커뮤니티 노출 + velog 포스트 효과)
- **Sentry 크래시 free 세션 99%+**

---

## 리스크 & 대응

1. **Rust 빌드 환경 변동성** — Tauri 2.x → 3.x 마이너 업그레이드 시 플러그인 호환성 깨질 가능. → CI 매트릭스에 Tauri LTS 핀 + 의존성 lock + 매월 1회 `cargo update --dry-run` 체크.
2. **코드사이닝 비용 ₩50만+** — EV cert 가 1년 갱신 부담. → 1차는 self-signed + SmartScreen 우회 안내, 누적 매출 ₩200만 도달 후 EV 구매.
3. **글로벌 핫키 충돌** — Win+V 기본 / QQ / Discord / 카카오톡 핫키와 겹칠 수 있음. → 첫 실행 시 핫키 충돌 검사 + 사용자 변경 가능 + 안내 모달.
4. **자동 붙여넣기 차단** — V3·알약·AhnLab Safe Transaction 이 enigo 시뮬레이션 차단. → 클립보드 복사 only fallback + 사용자에게 보안 SW 예외 등록 가이드.
5. **무료 도구 경쟁(Ditto / CopyQ)** — 가격 우위만으로는 약함. → 한국어 IME·자모 검색·ToolFunHub 디자인 일관성·Tauri 6MB 라는 4중 차별화로 답변.
6. **Lemon Squeezy 한국 결제 변동** — PG 정책 변경 시 결제 실패율 상승 가능. → 옵션 B(Sponsors) + 옵션 C(B2B) 듀얼 채널 준비, 단일 채널 의존 회피.
7. **WebView2 / Edge Chromium 업데이트로 인한 렌더 깨짐** — Win 자동 업데이트 시 발생 가능. → Sentry 에러 캡처 + 24시간 내 핫픽스 워크플로 + 사용자 다운그레이드 가이드.
