/**
 * 데모용 시드 데이터 — 첫 실행 시 1회만 주입.
 */

import type { ClipboardEntry, Snippet } from "../lib/types";
import { newId } from "../lib/store";

export function seedHistory(): ClipboardEntry[] {
  const now = Date.now();
  const items: Array<Omit<ClipboardEntry, "id">> = [
    {
      text: "git commit -m \"feat: clipboard manager MVP scaffolding\"",
      kind: "text",
      source: "Code.exe",
      createdAt: now - 1000 * 60 * 2,
      tags: ["git", "code"],
      pin: 0,
      usedAt: 0,
    },
    {
      text: "안녕하세요, 문의 주신 건은 영업일 기준 1~2일 내 답변드리겠습니다. 감사합니다.",
      kind: "text",
      source: "outlook.exe",
      createdAt: now - 1000 * 60 * 8,
      tags: ["cs", "template"],
      pin: 1,
      usedAt: now - 1000 * 60 * 30,
    },
    {
      text: "#6366f1",
      kind: "text",
      source: "Figma.exe",
      createdAt: now - 1000 * 60 * 14,
      tags: ["design", "color"],
      pin: 2,
      usedAt: 0,
    },
    {
      text: "SELECT id, name, email FROM users WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY id DESC;",
      kind: "text",
      source: "DataGrip.exe",
      createdAt: now - 1000 * 60 * 22,
      tags: ["sql"],
      pin: 0,
      usedAt: 0,
    },
    {
      text: "test@example.com / 010-1234-5678 / 4111-1111-1111-1111",
      kind: "text",
      source: "browser",
      createdAt: now - 1000 * 60 * 35,
      tags: ["sample", "pii"],
      pin: 0,
      usedAt: 0,
    },
    {
      text: "https://github.com/tauri-apps/tauri/releases/tag/tauri-v2.0.0",
      kind: "text",
      source: "chrome.exe",
      createdAt: now - 1000 * 60 * 50,
      tags: ["link"],
      pin: 0,
      usedAt: 0,
    },
    {
      text: "한국어 자모 분해 검색 테스트 — 'ㅎㄱ'으로 '한국' 매칭",
      kind: "text",
      source: "browser",
      createdAt: now - 1000 * 60 * 70,
      tags: ["demo"],
      pin: 0,
      usedAt: 0,
    },
  ];
  return items.map((it) => ({ ...it, id: newId() }));
}

export function seedSnippets(): Snippet[] {
  const now = Date.now();
  const items: Array<Omit<Snippet, "id">> = [
    {
      title: "오늘 날짜 인사",
      body: "안녕하세요, {date} {time} 기준 응답 드립니다.\n\n{cursor}\n\n감사합니다.",
      uses: 0,
      createdAt: now,
    },
    {
      title: "Git 커밋 템플릿",
      body: "feat: {cursor}\n\n- \n- \n",
      uses: 0,
      createdAt: now,
    },
    {
      title: "회의록 헤더",
      body: "## 회의록 — {date}\n참석자: {cursor}\n안건:\n- ",
      uses: 0,
      createdAt: now,
    },
    {
      title: "이전 클립보드 인용",
      body: "> {clipboard}\n\n위 내용 관련 회신:\n{cursor}",
      uses: 0,
      createdAt: now,
    },
  ];
  return items.map((it) => ({ ...it, id: newId() }));
}
