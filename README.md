# Clipboard Stash 📋

> **Win+V를 정면 대체하는 6MB Tauri 클립보드 매니저** — 무제한 히스토리, 글로벌 핫키, 정규식·태그·핀, 스니펫 변수 치환, 자동 마스킹.

> *English abstract*: Tauri-based Windows clipboard manager. Unlimited history (SQLite), global hotkey search, regex/tags/pinning, snippet variable expansion, automatic PII masking. Korean-first IME-friendly. MIT-licensed core, optional Pro license (₩19,000 lifetime).

ToolFunHub 디자인 시스템(인디고 #6366f1, Pretendard) 위에 만들어졌고, 향후 hub 흡수가 가능하도록 토큰·헤더·푸터 규칙을 그대로 따릅니다.

---

## 1차 MVP 산출물 — 듀얼 트랙

이 저장소는 **두 개의 트랙**을 동시에 담고 있습니다:

| 트랙 | 상태 | 빌드 명령 | 출력 |
|---|---|---|---|
| **A. 웹 데모 (React + Vite)** | ✅ 동작 | `npm run build` | `dist/` 정적 사이트 |
| **B. Tauri 데스크톱 (스켈레톤)** | 🚧 빌드 미검증 | `cargo tauri build` | `.exe` / `.msi` |

웹 데모는 브라우저 클립보드 API + localStorage 로 핵심 워크플로우를 100% 재현합니다.
Tauri 트랙은 글로벌 핫키 / SQLite / 자동 붙여넣기를 추가하는 향후 확장 지점입니다.

---

## 빠른 시작 (웹 데모)

```bash
npm install
npm run dev          # http://localhost:5173
```

빌드:

```bash
npm run build
npm run preview      # dist/ 미리보기
```

요구 환경: **Node 18+** (테스트: Node 24.13.0). 추가 라이브러리 무.

---

## 기능 (웹 데모 기준)

### 히스토리
- ✅ 수동 추가 (textarea + Ctrl/Cmd+Enter)
- ✅ "현재 클립보드 읽기" 버튼 (브라우저 권한 prompt)
- ✅ 핀 1~9 (별표 토글, 상단 고정)
- ✅ 출처 아이콘 (시드 데이터의 `source` 필드)
- ✅ 시간 / 글자수 / 태그 표시
- ✅ 중복 텍스트는 기존 항목을 위로 끌어올림

### 검색 (3-mode)
- **텍스트** — 부분 일치 (대소문자 무시)
- **정규식** — `\d{4}-\d{2}-\d{2}` 같은 패턴, 컴파일 오류 즉시 표시
- **자모** — `ㅎㄱ` 으로 `한국` 매칭. 두벌식·세벌식 IME 도중에도 부분 매칭

검색 결과는 인디고로 **하이라이트** 표시.

### 스니펫
- ✅ 즐겨찾기 스니펫 CRUD
- ✅ 변수 치환: `{date}`, `{time}`, `{datetime}`, `{clipboard}`, `{cursor}`
- ✅ "사용" 버튼 → 변수 치환 후 `navigator.clipboard.writeText`

### 자동 마스킹
표시 시점에만 가립니다 (저장은 원본):

| 패턴 | 마스킹 결과 |
|---|---|
| 신용카드 16자리 (`4111-1111-1111-1111`) | `**** **** **** 1111` |
| 한국 주민번호 (`xxxxxx-xxxxxxx`) | `xxxxxx-*******` |
| 한국 휴대폰 (`010-1234-5678`) | `010-****-5678` |
| 이메일 (`alice@example.com`) | `al****@example.com` |

상단 토글로 on/off (기본 on).

### 단축키 (웹)
| 키 | 동작 |
|---|---|
| <kbd>Alt</kbd> + <kbd>/</kbd> | 검색바 포커스 |
| <kbd>↑</kbd> / <kbd>↓</kbd> | 결과 이동 |
| <kbd>Enter</kbd> | 선택 항목 복사 |
| <kbd>Alt</kbd> + <kbd>1</kbd>~<kbd>9</kbd> | 해당 핀 즉시 복사 |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> (capture) | 새 항목 추가 |

> 데스크톱 빌드는 추가로 **Ctrl+Shift+V 글로벌 핫키** (어디서든 호출).

### 다크모드
ToolFunHub 공유 키 `tfh_theme` (한 도구에서 다크 켜면 다른 도구도 다크).

### 데이터 저장
- 히스토리: `tfh_clipboard-stash_history` (max 1000)
- 스니펫: `tfh_clipboard-stash_snippets`
- 설정: `tfh_clipboard-stash_settings`
- 시드 플래그: `tfh_clipboard-stash_seeded`
- 테마: `tfh_theme` (공통)

---

## 데스크톱 빌드 가이드 (Phase 1.x — 사용자 직접 수행)

⚠️ 로컬에 Rust toolchain 이 설치되어 있어야 합니다. 다음 순서로 진행:

### 1. 사전 요구
- **Rust 1.77+** — https://rustup.rs
- **Microsoft C++ Build Tools** (Windows) — Visual Studio Installer 에서 "Desktop development with C++"
- **WebView2 Runtime** — Win11 기본 포함, Win10은 https://developer.microsoft.com/microsoft-edge/webview2/
- **Node 18+**

### 2. tauri-cli 설치

```bash
cargo install tauri-cli --version "^2.0"
```

### 3. 아이콘 생성 (선택)

`src-tauri/icons/` 에 placeholder 만 있습니다. 원본 1024x1024 PNG 가 있으면:

```bash
cd src-tauri
cargo tauri icon path/to/source.png
```

없어도 빌드는 가능하지만 기본 아이콘이 사용됩니다.

### 4. 개발 모드

```bash
cargo tauri dev
```

Vite dev server (port 5173) 자동 시작 + WebView 윈도우 띄움. 코드 변경 시 hot reload.

### 5. 프로덕션 빌드

```bash
cargo tauri build
```

산출물: `src-tauri/target/release/bundle/`
- `nsis/Clipboard Stash_0.1.0_x64-setup.exe`
- `msi/Clipboard Stash_0.1.0_x64_en-US.msi`

> 코드사이닝이 없으므로 첫 실행 시 "알 수 없는 게시자" SmartScreen 경고가 뜹니다. "추가 정보 → 실행" 으로 우회.

---

## 폴더 구조

```
clipboard-stash/
├── package.json            # vite + react + ts (외부 라이브러리 없음)
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx             # 헤더·툴바·탭·메인 레이아웃
│   ├── styles/
│   │   ├── tokens.css      # ToolFunHub 토큰 + clipboard-stash 고유
│   │   └── app.css         # .card, .btn, layout
│   ├── components/
│   │   ├── ClipboardCapture.tsx
│   │   ├── HistoryList.tsx
│   │   ├── HistoryItem.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SnippetPanel.tsx
│   │   ├── HotkeyHint.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── store.ts        # localStorage 래퍼
│   │   ├── search.ts       # text · regex · jamo
│   │   ├── jamo.ts         # 한글 자모 분해
│   │   ├── snippets.ts     # 변수 치환 엔진
│   │   ├── mask.ts         # PII 마스킹
│   │   └── types.ts
│   └── data/
│       └── seed.ts         # 데모 시드 데이터
└── src-tauri/              # 데스크톱 스켈레톤 (빌드 미검증)
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    └── src/
        ├── main.rs
        ├── clipboard.rs    # arboard 폴링
        ├── db.rs           # SQLite + FTS5 plan
        ├── hotkey.rs       # Ctrl+Shift+V
        └── paste.rs        # enigo Ctrl+V 시뮬레이션
```

---

## 로드맵

### ✅ Phase 0 — MVP (현재)
- React 웹 데모 100% 동작
- Tauri 스켈레톤 (Rust 코드는 작성, 빌드는 사용자 환경에서)

### 🚧 Phase 1 — 데스크톱 빌드
- Rust 빌드 검증 (.msi/.nsis 생성)
- 글로벌 단축키 등록 + 충돌 검사
- arboard 폴링 → SQLite insert
- enigo 자동 붙여넣기

### 🔮 Phase 2 — Pro 기능
- FTS5 인덱스로 100만 건 검색 < 50ms
- 비밀번호 매니저 자동 제외 (활성 윈도우 감지)
- 클라우드 동기 (E2E 암호화)
- 코드사이닝 (EV cert)

### 🎯 Phase 3 — 수익화
- Lemon Squeezy 라이선스 키 발급
- 무료 plan limit (히스토리 100 / 스니펫 5)
- 업데이트 체크 (Tauri Updater)

---

## 라이선스

MIT (예정).

ToolFunHub 디자인 토큰은 자체 자산이며 동일 hub 내 도구에 한해 재사용 가능합니다.

---

**생성일**: 2026-04-30 | **배치**: afternoon #2 (자동 MVP 파이프라인)

## 문서
- [IDEATION.md](./IDEATION.md) — 기획·시장조사·수익모델
- [PROGRESS.md](./PROGRESS.md) — MVP 개발 기록
- [ROADMAP.md](./ROADMAP.md) — 정식 제품까지의 로드맵 (총 44.8d)
