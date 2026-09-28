export function leaderReceipt(transaction: any): any;
export function executionResult(transaction: any): string;
export function transactionFinalized(transaction: any): boolean;
export function receiptVerdict(transaction: any):
  | { kind: "error"; reason: string }
  | { kind: "executed" }
  | { kind: "pending" };
export function rollbackReasonFromTransaction(transaction: any): string;
export function cleanReason(value: unknown): string;
