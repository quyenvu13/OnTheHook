import crypto from "node:crypto";
import fs from "node:fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { receiptVerdict } from "../src/lib/receipt.js";

const ADDRESS = "0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166";
const DEPLOY_TX =
  "0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e";
const EXPECTED =
  "41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d";

function canonical(value) {
  return value.replace(/\r\n/g, "\n").replace(/\n$/, "");
}

const client = createClient({ chain: studionet });
const [code, transaction, limits] = await Promise.all([
  client.getContractCode(ADDRESS),
  client.getTransaction({ hash: DEPLOY_TX }),
  client.readContract({
    address: ADDRESS,
    functionName: "get_limits",
    args: [],
    transactionHashVariant: "latest-final"
  })
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
const verdict = receiptVerdict(transaction);

const checks = {
  address: ADDRESS,
  deploy_tx: DEPLOY_TX,
  expected_sha256: EXPECTED,
  local_sha256: localHash,
  onchain_sha256: onchainHash,
  source_parity: localHash === EXPECTED && onchainHash === EXPECTED,
  deploy_execution: verdict.kind,
  contract_name: limits?.contract_name,
  version: limits?.version
};

console.log(JSON.stringify(checks, null, 2));

if (
  !checks.source_parity
  || verdict.kind !== "executed"
  || checks.contract_name !== "OutcomeOwed"
  || checks.version !== "1.0"
) {
  process.exit(1);
}

console.log("PASS finalized deployment, source parity, and get_limits");
