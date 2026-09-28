import crypto from "node:crypto";
import fs from "node:fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { leaderReceipt, receiptVerdict } from "../src/lib/receipt.js";

const ADDRESS = "0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166";
const DEPLOY_TX =
  "0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e";
const EXPECTED =
  "41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d";
const AUTHOR = "0x923a09d0D6e5C242e36C3c1D2071835917cC0bDF";
const OTHER = "0x188f15bC55302ff2d55f0107300499aed23a831E";
const RESULT_ID =
  "2524e0f7a877a53d1efeaf4cc58491dee0d5ea71c66135398c0c5a767c24452f";
const EFFORT_ID =
  "88ddebfc95caf86104a2cb4547593d85b37db1a85aca055c7e5ac01395a3de8d";
const INTERACTIONS = {
  open_result:
    "0xbd20207f9bee68419f633db61f536cba6c3861120875ced07cfdc5372d20ce8e",
  claim_result:
    "0x573833d22cca5156b1121a286f7d0a0c71dedbf4f31c28538d98759592ac337f",
  open_effort:
    "0x30da340d8679dd815b3e90f8f1ecb2cbe7066fb9637fc1edf1abf7ed2f4361e8",
  log_effort:
    "0x1bf73826689b5f76c09c0b50a221a17e99d510722142cd65adfe1794a5fee7ab"
};

function canonical(value) {
  return value.replace(/\r\n/g, "\n").replace(/\n$/, "");
}

function lower(value) {
  return String(value ?? "").toLowerCase();
}

function finalized(transaction) {
  const status = transaction?.status;
  if (typeof status === "number") return status === 7;
  return String(transaction?.statusName ?? transaction?.status_name ?? status)
    .toUpperCase() === "FINALIZED";
}

function readableCall(transaction) {
  return String(
    transaction?.data?.calldata?.readable
    ?? transaction?.data?.calldata
    ?? ""
  );
}

function semanticOutcome(transaction) {
  const receipt = leaderReceipt(transaction);
  const outputs = receipt?.eq_outputs ?? receipt?.eqOutputs ?? {};
  const first = Object.values(outputs)[0];
  const readable = first?.payload?.readable ?? first?.readable;
  if (typeof readable !== "string") return "";
  try {
    return String(JSON.parse(readable)?.outcome ?? "");
  } catch {
    return "";
  }
}

function transactionSummary(transaction) {
  return {
    hash: transaction?.hash ?? transaction?.tx_id,
    from: transaction?.from_address ?? transaction?.sender,
    status: transaction?.statusName ?? transaction?.status_name ?? transaction?.status,
    execution: receiptVerdict(transaction).kind,
    semantic_outcome: semanticOutcome(transaction) || undefined
  };
}

const client = createClient({ chain: studionet });
const readArgs = (functionName, args = []) => ({
  address: ADDRESS,
  functionName,
  args,
  stateStatus: "accepted",
  transactionHashVariant: "latest-final"
});

const [
  code,
  deployment,
  limits,
  resultRecord,
  effortRecord,
  effortLog,
  openResult,
  claimResult,
  openEffort,
  logEffort
] = await Promise.all([
  client.getContractCode(ADDRESS),
  client.getTransaction({ hash: DEPLOY_TX }),
  client.readContract(readArgs("get_limits")),
  client.readContract(readArgs("get_undertaking", [RESULT_ID])),
  client.readContract(readArgs("get_undertaking", [EFFORT_ID])),
  client.readContract(readArgs("get_log", [EFFORT_ID, 0, 50])),
  client.getTransaction({ hash: INTERACTIONS.open_result }),
  client.getTransaction({ hash: INTERACTIONS.claim_result }),
  client.getTransaction({ hash: INTERACTIONS.open_effort }),
  client.getTransaction({ hash: INTERACTIONS.log_effort })
]);

const local = canonical(
  fs.readFileSync(new URL("../contracts/OutcomeOwed.py", import.meta.url), "utf8")
);
const onchainHash = crypto
  .createHash("sha256")
  .update(Buffer.from(canonical(code), "utf8"))
  .digest("hex");
const localHash = crypto
  .createHash("sha256")
  .update(Buffer.from(local, "utf8"))
  .digest("hex");
const deploymentVerdict = receiptVerdict(deployment);
const interactionTransactions = [openResult, claimResult, openEffort, logEffort];
const interactionsExecuted = interactionTransactions.every(
  (transaction) => finalized(transaction) && receiptVerdict(transaction).kind === "executed"
);
const callsMatch =
  readableCall(openResult).includes('"method":"open_undertaking"')
  && readableCall(openResult).includes("The backlog will be cleared.")
  && readableCall(claimResult).includes('"method":"claim_discharge"')
  && readableCall(claimResult).includes("The backlog has been cleared.")
  && readableCall(openEffort).includes('"method":"open_undertaking"')
  && readableCall(openEffort).includes("The backlog will be worked on daily.")
  && readableCall(logEffort).includes('"method":"log_entry"')
  && readableCall(logEffort).includes("Daily work has started.");
const callersMatch =
  lower(openResult?.from_address ?? openResult?.sender) === lower(AUTHOR)
  && lower(claimResult?.from_address ?? claimResult?.sender) === lower(AUTHOR)
  && lower(openEffort?.from_address ?? openEffort?.sender) === lower(AUTHOR)
  && lower(logEffort?.from_address ?? logEffort?.sender) === lower(OTHER);
const semanticOutputsMatch =
  semanticOutcome(openResult) === "RESULT_OWED"
  && semanticOutcome(openEffort) === "EFFORT_OWED";
const resultPostStateMatches =
  resultRecord?.undertaking_id === RESULT_ID
  && lower(resultRecord?.author) === lower(AUTHOR)
  && lower(resultRecord?.other_wallet) === lower(OTHER)
  && resultRecord?.other_label === "the Client"
  && resultRecord?.text === "The backlog will be cleared."
  && resultRecord?.outcome === "RESULT_OWED"
  && resultRecord?.kind === "RESULT"
  && resultRecord?.state === "CLAIMED"
  && resultRecord?.claim_note === "The backlog has been cleared."
  && resultRecord?.rebut_note === ""
  && Number(resultRecord?.log_count) === 0;
const effortPostStateMatches =
  effortRecord?.undertaking_id === EFFORT_ID
  && lower(effortRecord?.author) === lower(AUTHOR)
  && lower(effortRecord?.other_wallet) === lower(OTHER)
  && effortRecord?.other_label === "the Client"
  && effortRecord?.text === "The backlog will be worked on daily."
  && effortRecord?.outcome === "EFFORT_OWED"
  && effortRecord?.kind === "EFFORT"
  && effortRecord?.state === "RUNNING"
  && Number(effortRecord?.log_count) === 1
  && Array.isArray(effortLog)
  && effortLog.length === 1
  && Number(effortLog[0]?.index) === 1
  && lower(effortLog[0]?.by) === lower(OTHER)
  && effortLog[0]?.note === "Daily work has started.";

const checks = {
  address: ADDRESS,
  deploy_tx: DEPLOY_TX,
  expected_sha256: EXPECTED,
  local_sha256: localHash,
  onchain_sha256: onchainHash,
  source_parity: localHash === EXPECTED && onchainHash === EXPECTED,
  deploy_execution: deploymentVerdict.kind,
  contract_name: limits?.contract_name,
  version: limits?.version,
  runtime_transactions: {
    open_result: transactionSummary(openResult),
    claim_result: transactionSummary(claimResult),
    open_effort: transactionSummary(openEffort),
    log_effort: transactionSummary(logEffort)
  },
  interaction_execution: interactionsExecuted,
  interaction_calls: callsMatch,
  interaction_callers: callersMatch,
  semantic_outputs: semanticOutputsMatch,
  result_post_state: resultPostStateMatches,
  effort_post_state: effortPostStateMatches
};

console.log(JSON.stringify(checks, null, 2));

if (
  !checks.source_parity
  || deploymentVerdict.kind !== "executed"
  || checks.contract_name !== "OutcomeOwed"
  || checks.version !== "1.0"
  || !checks.interaction_execution
  || !checks.interaction_calls
  || !checks.interaction_callers
  || !checks.semantic_outputs
  || !checks.result_post_state
  || !checks.effort_post_state
) {
  process.exit(1);
}

console.log("PASS finalized deployment, source parity, and get_limits");
console.log("PASS four finalized Project interactions with GenVM SUCCESS");
console.log("PASS RESULT_OWED and EFFORT_OWED semantic outputs");
console.log("PASS finalized CLAIMED result and RUNNING one-entry effort post-state");
