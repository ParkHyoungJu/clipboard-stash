/**
 * 자동 마스킹 — 표시 시에만 가린다 (저장은 원본).
 *
 * 패턴:
 *  - 신용카드 16자리 (4-4-4-4 with `-`/space/none) → 끝 4자리만 노출
 *  - 한국 주민번호 6-7
 *  - 이메일 → local 첫 2자만 노출
 *  - 한국 휴대폰 010-XXXX-XXXX → 가운데 가리기
 *
 * 결과는 segment 배열이라 React에서 위험 없이 span으로 렌더할 수 있음.
 */

export type Segment =
  | { type: "text"; text: string }
  | { type: "mask"; text: string; label: string };

interface Rule {
  /** 정규식 — 반드시 g 플래그. */
  re: RegExp;
  /** 매치 발견 시 mask label. */
  label: string;
  /** 매치 텍스트를 마스킹된 표시 문자열로 변환. */
  render: (match: string) => string;
}

const RULES: Rule[] = [
  // 신용카드 16자리: 4-4-4-4 (`-`, 공백, 또는 붙어있음)
  {
    re: /(?:\d[ -]?){15}\d/g,
    label: "card",
    render: (m) => {
      const digits = m.replace(/\D/g, "");
      if (digits.length !== 16) return m;
      return `**** **** **** ${digits.slice(12)}`;
    },
  },
  // 주민등록번호 6-7
  {
    re: /\b\d{6}[- ]?\d{7}\b/g,
    label: "rrn",
    render: (m) => {
      const digits = m.replace(/\D/g, "");
      if (digits.length !== 13) return m;
      return `${digits.slice(0, 6)}-*******`;
    },
  },
  // 한국 휴대폰 010-XXXX-XXXX (또는 011/016/017/018/019)
  {
    re: /\b01[0-9][- ]?\d{3,4}[- ]?\d{4}\b/g,
    label: "phone",
    render: (m) => {
      const digits = m.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) return m;
      return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
    },
  },
  // 이메일
  {
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    label: "email",
    render: (m) => {
      const at = m.indexOf("@");
      if (at < 0) return m;
      const local = m.slice(0, at);
      const domain = m.slice(at);
      const head = local.slice(0, Math.min(2, local.length));
      return `${head}${"*".repeat(Math.max(1, local.length - head.length))}${domain}`;
    },
  },
];

/**
 * 텍스트를 마스킹 segment 배열로 분할. 마스킹할 패턴이 없으면 단일 text segment.
 *
 * @param enabled false 면 항상 단일 text segment 반환.
 */
export function maskText(text: string, enabled: boolean): Segment[] {
  if (!enabled || !text) return [{ type: "text", text }];

  type Hit = { start: number; end: number; rendered: string; label: string };
  const hits: Hit[] = [];

  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = rule.re.exec(text)) !== null && guard++ < 200) {
      if (m[0].length === 0) {
        rule.re.lastIndex++;
        continue;
      }
      hits.push({
        start: m.index,
        end: m.index + m[0].length,
        rendered: rule.render(m[0]),
        label: rule.label,
      });
    }
  }

  if (hits.length === 0) return [{ type: "text", text }];

  // 겹침 제거: 시작 인덱스 정렬, 이전과 겹치면 skip.
  hits.sort((a, b) => a.start - b.start);
  const filtered: Hit[] = [];
  let prevEnd = -1;
  for (const h of hits) {
    if (h.start < prevEnd) continue;
    filtered.push(h);
    prevEnd = h.end;
  }

  const out: Segment[] = [];
  let cursor = 0;
  for (const h of filtered) {
    if (h.start > cursor) out.push({ type: "text", text: text.slice(cursor, h.start) });
    out.push({ type: "mask", text: h.rendered, label: h.label });
    cursor = h.end;
  }
  if (cursor < text.length) out.push({ type: "text", text: text.slice(cursor) });
  return out;
}

/** segment 배열을 다시 일반 문자열로 직렬화 (UI 외 용도, 예: 클립보드). */
export function segmentsToText(segs: Segment[]): string {
  return segs.map((s) => s.text).join("");
}
