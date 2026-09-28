import { cleanReason } from "./receipt.js";

const KNOWN_MESSAGES = [
  "The other side cannot be the author",
  "Invalid other-side wallet",
  "Other-side wallet cannot be the zero address",
  "Other-side label cannot be empty",
  "Other-side label is too long",
  "Other-side label contains a reserved prompt token",
  "Undertaking text cannot be empty",
  "Undertaking text is too long",
  "Undertaking text contains a reserved prompt token",
  "Undertaking already exists",
  "Undertaking not found",
  "Only the author may claim discharge",
  "This is a standing obligation; add a log entry instead",
  "Discharge has already been claimed",
  "Only the named other side may rebut",
  "There is no claim to rebut",
  "This undertaking is discharged by a claim, not by a log",
  "Only the two named sides may add log entries",
  "Log is full",
  "Note cannot be empty",
  "Note is too long"
];

function collectStrings(
  value: unknown,
  output: string[],
  seen: Set<unknown>,
  depth: number
) {
  if (depth > 6 || value == null) return;
  if (typeof value === "string") {
    output.push(value);
    try {
      collectStrings(JSON.parse(value), output, seen, depth + 1);
    } catch {
      // Ordinary error strings are expected.
    }
    return;
  }
  if (typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  const record = value as Record<string, unknown>;
  for (const key of [
    "shortMessage",
    "reason",
    "message",
    "details",
    "data",
    "error",
    "body",
    "cause"
  ]) {
    if (key in record) collectStrings(record[key], output, seen, depth + 1);
  }
}

export function containsMessage(error: unknown, phrase: string): boolean {
  const values: string[] = [];
  collectStrings(error, values, new Set(), 0);
  return values.some((value) =>
    value.toLowerCase().includes(phrase.toLowerCase())
  );
}

export function errorMessage(error: unknown): string {
  const values: string[] = [];
  collectStrings(error, values, new Set(), 0);
  const joined = values.join("\n");

  for (const known of KNOWN_MESSAGES) {
    if (joined.toLowerCase().includes(known.toLowerCase())) return known;
  }
  if (joined.includes("User rejected") || joined.includes("rejected the request")) {
    return "The wallet request was rejected.";
  }
  if (joined.includes("MetaMask") && joined.includes("not found")) {
    return "MetaMask was not found.";
  }
  if (values.length > 0) return cleanReason(values[0]);
  return "The request could not be completed.";
}
