/**
 * 한글 자모 분해 — "한국" → "ㅎㅏㄴㄱㅜㄱ"
 *
 * 검색에서 사용자가 "ㅎㄱ" 만 입력해도 "한국"이 매칭되도록 자모 시퀀스를 펼쳐
 * substring 비교한다. 두벌식·세벌식 IME 모두에서 사용자 입력 도중 부분 매칭에 유용.
 *
 * 알고리즘: 한글 음절 영역 (U+AC00 ~ U+D7A3) 의 한 글자를
 *   초성 (CHO 19), 중성 (JUNG 21), 종성 (JONG 28, 0=없음) 으로 분해.
 *   index = (cho * 21 + jung) * 28 + jong; (음절 - 0xAC00 = index)
 *
 * 호환 자모 (U+3131 ~ U+318E) 는 사용자 입력측에서 자주 쓰이므로
 * 같은 KeyCode 로 정규화한다 (예: ㄱ U+3131 ↔ U+1100 둘 다 'ㄱ').
 */

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

const CHO = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const JUNG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const JONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

/** 한 글자(또는 호환 자모)를 자모 문자열로 분해. 한글이 아니면 lowercase 그대로. */
export function decomposeChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= HANGUL_BASE && code <= HANGUL_END) {
    const idx = code - HANGUL_BASE;
    const cho = Math.floor(idx / (21 * 28));
    const jung = Math.floor((idx % (21 * 28)) / 28);
    const jong = idx % 28;
    return CHO[cho] + JUNG[jung] + JONG[jong];
  }
  // 호환 자모 영역 그대로 (U+3131~) — 사용자가 IME 도중 입력한 단일 자모.
  return ch.toLowerCase();
}

/** 문자열 전체를 자모 시퀀스로 분해. */
export function decompose(text: string): string {
  let out = "";
  for (const ch of text) {
    out += decomposeChar(ch);
  }
  return out;
}

/** 쿼리가 텍스트의 자모 시퀀스에 부분문자열로 포함되는지 확인. */
export function jamoIncludes(text: string, query: string): boolean {
  if (!query) return true;
  const qd = decompose(query);
  if (!qd) return true;
  const td = decompose(text);
  return td.includes(qd);
}
