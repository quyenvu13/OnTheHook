export type RecordKind = "RESULT" | "EFFORT";
export type RecordState = "OPEN" | "CLAIMED" | "SETTLED" | "RUNNING";

export interface Undertaking {
  undertaking_id: string;
  author: string;
  other_wallet: string;
  other_label: string;
  text: string;
  outcome_code: number;
  outcome: "RESULT_OWED" | "EFFORT_OWED";
  kind: RecordKind;
  state: RecordState;
  claim_note: string;
  rebut_note: string;
  log_count: number;
}

export interface LogEntry {
  index: number;
  note: string;
  by: string;
}

export interface Limits {
  contract_name: string;
  version: string;
  semantic_outcomes: string[];
  result_states: string[];
  effort_states: string[];
  max_text_length: number;
  max_label_length: number;
  max_note_length: number;
  max_log_entries: number;
  max_page_size: number;
  global_admin: boolean;
  clock_used: boolean;
  external_web_used: boolean;
  money_used: boolean;
  preview_endpoint_exposed: boolean;
  wallet_identity_verified: boolean;
  rubric_hash: string;
}

export interface RecordBundle {
  record: Undertaking;
  logs: LogEntry[];
}

export type TxKind = "idle" | "signing" | "submitted" | "success" | "error";

export interface TxState {
  kind: TxKind;
  message: string;
  hash?: string;
  undertakingId?: string;
}
