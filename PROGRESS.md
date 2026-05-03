# 진행 로그

**프로젝트**: Clipboard Stash — Tauri Windows 클립보드 매니저
**시작**: 2026-04-30 afternoon
**배치**: afternoon #2

**환경 메모**: 로컬에 Rust/cargo 미설치 (Node v24.13.0 / npm 11.6.2 만 있음). 따라서 MVP 1차 산출물은 **React+Vite 웹 데모 + Tauri 스켈레톤**. 실제 데스크톱 빌드는 사용자가 Rust toolchain 설치 후 가능.

---

## [frontend-dev] 14:50 — React 웹데모 + Tauri 스켈레톤

### 작성 파일
- 빌드 설정: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `README.md`
- 스타일: `src/styles/tokens.css`, `src/styles/app.css` (ToolFunHub 토큰 100% 준수 + `--clipboard-stash-*` 고유 토큰)
- 진입점: `src/main.tsx`, `src/App.tsx`
- 컴포넌트 (7개): `ClipboardCapture`, `SearchBar`, `HistoryList`, `HistoryItem`, `SnippetPanel`, `HotkeyHint`, `ThemeToggle`
- 라이브러리 (6개): `lib/store.ts` (localStorage 래퍼), `lib/search.ts` (3-mode), `lib/jamo.ts` (한글 자모 분해), `lib/snippets.ts` (변수 치환), `lib/mask.ts` (PII 마스킹), `lib/types.ts`
- 데이터: `data/seed.ts` (히스토리 7개 + 스니펫 4개)
- Tauri 스켈레톤: `src-tauri/Cargo.toml`, `tauri.conf.json`, `build.rs`, `src/{main,clipboard,db,hotkey,paste}.rs`, `icons/README.txt`

### 의존성 (외부 라이브러리 0개 — UI 라이브러리·차트 없음)
- runtime: `react`, `react-dom`
- dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`
- 총 68 npm 패키지 (transitive 포함)

### 빌드 결과
- `npm install`: 성공 (9초, 0 vulnerabilities — moderate 2개는 vite/esbuild 의 알려진 dev-only 이슈)
- `npm run build` (= `tsc -b && vite build`): **성공**
  - `dist/index.html` 0.95 kB
  - `dist/assets/index-*.css` 10.93 kB (gzip 2.87 kB)
  - `dist/assets/index-*.js` 162.97 kB (gzip 53.80 kB) — 정확히 React 18 minimum 수준
  - 빌드 시간 394ms
- TypeScript strict mode 통과, JSX 컴파일 에러 없음

### 동작 확인 (코드 레벨 검증)
- ToolFunHub 헤더 마크업 §2.1 그대로 (로고 `🛠️ ToolFunHub`, back-link `← 홈으로`, 🌙 토글)
- `tfh_theme` localStorage 키로 테마 토글 (다른 hub 도구와 공유)
- `tfh_clipboard-stash_*` prefix 일관 적용 (4개 키)
- 360px 모바일 반응형 미디어쿼리 적용
- 시드 데이터 7개 항목 + 4개 스니펫 첫 실행 시 자동 주입
- 검색 3-mode 컴파일: text → substring, regex → RegExp(g,i), jamo → 한글 자모 분해 비교
- 마스킹: 카드 16자리 / 주민번호 / 휴대폰 / 이메일 4종
- 단축키: Alt+/, ↑↓, Enter, Alt+1~9, Ctrl/Cmd+Enter

### 미해결 (Phase 2)
- **Rust 빌드** — 사용자 환경 의존 (Rust toolchain + WebView2 + tauri-cli 필요). README §데스크톱 빌드 가이드 참고.
- **글로벌 핫키** Ctrl+Shift+V — Tauri 전용. 웹은 Alt+/ 폴백.
- **SQLite + FTS5 인덱스** — 현재 localStorage (max 1000개 limit). `db.rs` 에 스키마 plan 주석.
- **자동 클립보드 폴링** — `src-tauri/src/clipboard.rs` arboard 30ms 루프 작성 완료, 빌드 후 검증 필요.
- **자동 붙여넣기** — `paste.rs` enigo 시뮬레이션, 보안 SW 차단 폴백 미구현.
- **하이라이트 인덱스 매핑** — jamo 모드에서 마스킹 후 텍스트 vs 원문 인덱스 정확 매핑 (현재 lowercased substring 폴백).
- **아이콘** — `src-tauri/icons/` 에 placeholder README 만 있음, 실제 PNG/ICO 필요.
- **코드사이닝** — EV cert 없음, "알 수 없는 게시자" 경고 발생.

---

## [qc-tester] 검증 결과 — 2026-04-30 15:10

외부 시각 재검증. 로컬 환경: Node v24.13 / Windows. Rust 미설치 → Tauri 빌드 검증 불가.

### 환경 / 빌드
- `npm install`: skip (이미 `node_modules/` 존재) — 추가 deps 없음 확인
- `npm run build` (`tsc -b && vite build`): **성공** (375ms, exit 0)
- 산출물:
  - `dist/index.html` 1,044 B
  - `dist/assets/index-*.css` 10,927 B (gzip 2.87 kB)
  - `dist/assets/index-*.js` 162,974 B (gzip 53.80 kB)
  - **raw 합계 ≈ 175 KB / gzip ≈ 57 KB** — 기준 (raw <300KB / gzip <80KB) 통과

### 정적 서버 동작 (port 7301)
- `GET /` → 200, 950 bytes (HTML shell)
- `GET /assets/*.js` → 200, 162,974 bytes
- HTML title 에 `ToolFunHub` 포함: YES (정적 마크업 한정)
- 번들 JS 안에 `ToolFunHub`: YES, `홈으로`: YES, `themeToggle`: YES → 런타임 헤더 정상 렌더 가능
- 번들에 `tfh_clipboard-stash_` prefix / `localStorage` / 한글 자모 데이터 모두 포함

### 디자인 일관성 (hub-tool 11항목)
| 체크 | 결과 | 비고 |
|---|---|---|
| 🛠️ ToolFunHub 로고 | PASS | App.tsx:233 `<a className="logo">🛠️ ToolFunHub</a>` |
| ← 홈으로 back-link | PASS | App.tsx:237 `<a className="back-link">← 홈으로</a>` |
| themeToggle id | PASS | ThemeToggle.tsx:49 `id="themeToggle"` |
| header-left deprecated 미사용 | PASS | grep 0건 |
| 긴 형태 "홈으로 돌아가기" 미사용 | PASS | grep 0건 |
| theme-icon sub-element 미사용 | PASS | grep 0건 |
| --primary #6366f1 | PASS | tokens.css:9 |
| --primary-dark #4f46e5 | PASS | tokens.css:10 |
| --primary-soft #eef2ff | PASS | tokens.css:11 |
| tools.js 등록 | N/A | hub 흡수 시점에 등록 (현재 standalone web demo) |
| CDN ≤ 2개 | PASS | Pretendard + Inter 2개 |

종합: **10/10 적용가능 항목 PASS** (tools.js 등록은 Phase 2 hub 흡수 시점에 해당, 현재 N/A).

### 정적 검증
- `package.json` deps 정확히 `react`, `react-dom` 만 — UI/차트/lodash 추가 없음 (PASS)
- `src/lib/store.ts` 의 prefix `PREFIX = "tfh_clipboard-stash_"` 상수 1회 정의 후 4개 키 (history/snippets/settings/seeded) 에 템플릿 리터럴로 일관 적용 — grep 리터럴 카운트는 2지만 **로직상 4키 prefix PASS**
- `src-tauri/tauri.conf.json` productName "Clipboard Stash", identifier `com.toolfunhub.clipboard-stash`, windows 설정 (720x540, minSize 360x320, visible:false 트레이 기동), trayIcon, globalShortcut 플러그인 모두 존재 — 스켈레톤 합격
- `tokens.css` 표준 토큰 전부 표준 값, 도구 고유 토큰은 `--clipboard-stash-*` 네임스페이스로 격리 — 우수

### 주요 기능 수동 확인 (코드/번들 레벨)
- 빌드/서빙: **OK**
- ToolFunHub 헤더 렌더 (로고/백링크/테마토글): **OK** (번들 포함 확인)
- localStorage prefix 일관: **OK**
- 한글 자모 분해 데이터 (CHO/JUNG/JONG): **OK** (번들 내 한글 자모 문자 확인)
- PII 마스킹 (카드/주민/휴대폰/이메일): **OK** (코드 레벨, 런타임 검증은 브라우저 필요)
- 클립보드 캡처 (web 데모): **NG·검증불가** — `navigator.clipboard.read()` 권한 모달은 실제 브라우저에서만 확인 가능
- 글로벌 핫키 Ctrl+Shift+V: **NG·예상됨** — Tauri 미빌드, 웹은 Alt+/ 폴백만
- Tauri 데스크톱 빌드: **검증불가** — Rust 미설치 (예상된 MVP 한계)

### 발견된 이슈 (Phase 2 후보)
1. **[P3] Tauri 아이콘 placeholder 만 존재** — `src-tauri/icons/` 에 README.txt 만, 실제 32x32.png / icon.ico / icon.icns 부재. `tauri.conf.json` bundle.icon 이 `icons/icon.png` 참조 → Rust 빌드 시 즉시 실패 예상. 실제 PNG 1장만 있어도 `cargo tauri icon` 으로 6종 자동생성 가능.
2. **[P2] tauri.conf.json `withGlobalTauri: false`** + `frontendDist: "../dist"` 조합 — frontend 가 `window.__TAURI__` 없이 빌드돼 있으므로 Tauri 빌드 후 IPC invoke 호출 코드가 별도 추가돼야 함 (현재 src/ 안에 `@tauri-apps/api` import 없음). MVP 의 의도된 분리이긴 하나, Phase 2 에서 IPC bridge 모듈 신규 작성 필요 명시.
3. **[P3] sourcemap 산출** — `dist/assets/*.js.map` (430 KB) 가 production 산출물에 포함. 배포 시 노출 원치 않으면 `vite.config.ts` 의 `build.sourcemap: false` 권장.
4. **[P3] Tauri 미빌드를 명시적으로 거부** — `npm run tauri` 가 echo 후 exit 1 — 의도된 동작이지만 사용자가 보면 깨진 것처럼 보임. 메시지에 "Rust 설치 후 `cargo tauri dev` 직접 실행" 가이드 한 줄 추가 권장.
5. **[P2] jamo 검색 hilight 인덱스 매핑** — frontend-dev 자체 보고에도 명시된 한계 (마스킹 후 텍스트 vs 원문 인덱스). Phase 2 에 그대로 이관.
6. **[P3] 코드사이닝 부재** — Tauri MSI/NSIS 출력에 EV cert 없음, "알 수 없는 게시자" 경고. 출시 직전 Phase 까지 미루는 게 합리적.

### 배포 가능성 판단
- **로컬 실행 가능 (웹 데모)**: `npm run build && npm run preview` 즉시 가동, ToolFunHub 헤더·token·prefix·자모·마스킹 전부 코드/번들 수준 검증 통과.
- **Tauri 데스크톱 빌드**: 검증불가 (로컬 Rust 미설치) + 아이콘 부재로 **현재 그대로는 빌드 실패 확정**. Phase 2 진입 전 아이콘 파일 1장 + Rust 환경에서의 `cargo tauri build` 1회 dry-run 필수.

**최종**: 웹 데모 부분은 **합격**. Tauri 부분은 **스켈레톤 단계 — 합격이지만 빌드 미검증**.

---

## [로드맵 기획] 15:25
- ROADMAP.md 생성: Phase 2/3/4 총 58개 체크박스
- 전체 예상 기간: 44.8d (1인 기준, 약 9주)
- 수익화 전략: 옵션 A 우선 (Lemon Squeezy ₩19K 일회성) + 옵션 B 후속 (Sponsors + Pro 클라우드 동기) + 옵션 C 후반 (B2B 시트당 ₩5K/월)
