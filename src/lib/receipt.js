function asUpper(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function consensusData(transaction) {
  return transaction?.consensus_data ?? transaction?.consensusData ?? {};
}

export function leaderReceipt(transaction) {
  const consensus = consensusData(transaction);
  const raw = consensus?.leader_receipt ?? consensus?.leaderReceipt;
  if (!Array.isArray(raw)) return raw ?? null;
  return raw.find((item) => asUpper(item?.mode) === "LEADER") ?? raw[0] ?? null;
}

export function executionResult(transaction) {
  const leader = leaderReceipt(transaction);
  return asUpper(
    leader?.execution_result
    ?? leader?.executionResult
    ?? transaction?.txExecutionResultName
  );
}

export function transactionFinalized(transaction) {
  const status = transaction?.status;
  if (typeof status === "number") return status === 7;
  const label = asUpper(
    transaction?.status_name
    ?? transaction?.statusName
    ?? transaction?.consensus_status
    ?? transaction?.consensusStatus
    ?? status
  );
  return label === "FINALIZED" || label === "ACCEPTED";
}

export function receiptVerdict(transaction) {
  const result = executionResult(transaction);
  if (result === "ERROR" || result === "FINISHED_WITH_ERROR") {
    return { kind: "error", reason: rollbackReasonFromTransaction(transaction) };
  }
  if (
    transactionFinalized(transaction)
    && (result === "SUCCESS" || result === "FINISHED_WITH_RETURN")
  ) {
    return { kind: "executed" };
  }
  return { kind: "pending" };
}

export function rollbackReasonFromTransaction(transaction) {
  const leader = leaderReceipt(transaction);
  const candidates = [
    leader?.error,
    leader?.message,
    leader?.return_data,
    leader?.returnData,
    transaction?.error,
    transaction?.message
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return cleanReason(value);
  }
  return "Contract execution rolled back.";
}

export function cleanReason(value) {
  const text = String(value || "").trim();
  const rollback = text.match(/\[rollback\]\s*([^\n\r]+)/i);
  if (rollback?.[1]) return rollback[1].trim();
  const userError = text.match(/UserError(?:\(|:)\s*["']?([^"'\n\r)]+)/i);
  if (userError?.[1]) return userError[1].trim();
  return text.length > 420 ? text.slice(0, 417) + "…" : text;
}
