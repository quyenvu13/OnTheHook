import { isAddress, keccak256, toBytes } from "viem";

const PY_WHITESPACE =
  /[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/gu;
const PY_EDGE_WHITESPACE =
  /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/gu;

export function pyStrip(value) {
  return String(value).replace(PY_EDGE_WHITESPACE, "");
}

export function pyNormalize(value) {
  return pyStrip(value).split(PY_WHITESPACE).filter(Boolean).join(" ");
}

export function pyLen(value) {
  return Array.from(String(value)).length;
}

export function undertakingId(author, text) {
  if (!isAddress(author)) throw new Error("Author must be a valid EVM address.");
  const normalized = pyNormalize(text);
  if (!normalized) throw new Error("Undertaking text cannot be empty.");
  const payload =
    "OUTCOME_OWED:UNDERTAKING:V1|"
    + author.toLowerCase()
    + "|"
    + String(pyLen(normalized))
    + "|"
    + normalized;
  return keccak256(toBytes(payload)).slice(2);
}

export function normalizeId(value) {
  return pyStrip(value).toLowerCase().replace(/^0x/, "");
}

export function validId(value) {
  return /^[0-9a-f]{64}$/.test(normalizeId(value));
}

export function shortAddress(value, left = 6, right = 4) {
  const text = String(value || "");
  if (text.length <= left + right + 1) return text;
  return text.slice(0, left) + "…" + text.slice(-right);
}
