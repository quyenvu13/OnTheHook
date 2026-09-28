import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  executionResult,
  leaderReceipt,
  receiptVerdict,
  transactionFinalized
} from "../src/lib/receipt.js";

test("finalized SUCCESS receipt is recognized as executed", () => {
  const transaction = {
    status: 7,
    consensus_data: {
      leader_receipt: {
        mode: "leader",
        execution_result: "SUCCESS"
      }
    }
  };
  assert.equal(transactionFinalized(transaction), true);
  assert.equal(executionResult(transaction), "SUCCESS");
  assert.deepEqual(receiptVerdict(transaction), { kind: "executed" });
});

test("missing execution result is never called success", () => {
  assert.deepEqual(receiptVerdict({ status: 7 }), { kind: "pending" });
});

test("leader receipt is selected from a receipt list", () => {
  const selected = leaderReceipt({
    consensus_data: {
      leader_receipt: [
        { mode: "validator", execution_result: "SUCCESS" },
        { mode: "leader", execution_result: "ERROR", error: "boom" }
      ]
    }
  });
  assert.equal(selected.mode, "leader");
});

test("rollback reason is surfaced from leader receipt", () => {
  const transaction = {
    status: 7,
    consensus_data: {
      leader_receipt: {
        mode: "leader",
        execution_result: "ERROR",
        error: "[rollback] This undertaking is discharged by a claim, not by a log"
      }
    }
  };
  assert.deepEqual(receiptVerdict(transaction), {
    kind: "error",
    reason: "This undertaking is discharged by a claim, not by a log"
  });
});

test("React escapes contract text rendered as a text child", () => {
  const hostile = "<img src=x onerror=alert(1)>";
  const markup = renderToStaticMarkup(createElement("p", null, hostile));
  assert.equal(markup.includes("<img"), false);
  assert.equal(markup.includes("&lt;img"), true);
});
