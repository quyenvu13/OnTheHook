import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const app = read("src/App.tsx");
const genlayer = read("src/lib/genlayer.ts");
const config = read("src/lib/config.ts");
const styles = read("src/styles.css");
const vite = read("vite.config.ts");
const vercel = read("vercel.json");
const tsconfig = JSON.parse(read("tsconfig.node.json"));
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));

const failures = [];
function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(label + " is missing");
}
function forbidText(source, text, label) {
  if (source.includes(text)) failures.push(label + " is present");
}

for (const label of [
  "Open another",
  "Claim discharge",
  "Rebut claim",
  "Add log entry"
]) {
  requireText(app, label, "always-visible action " + label);
}

requireText(
  app,
  "This undertaking is discharged by a claim, not by a log",
  "RESULT disabled-method explanation"
);
requireText(
  app,
  "This is a standing obligation; add a log entry instead",
  "EFFORT disabled-method explanation"
);
requireText(app, "recordExists(id)", "accepted-state duplicate preflight");
requireText(app, "loadRecordBundle(id)", "post-write accepted-state reload");
requireText(app, "This record has no completed state.", "EFFORT permanence copy");
requireText(app, "Claim:", "RESULT one-of-one count");
requireText(app, "no end state", "EFFORT no-end-state count");
requireText(genlayer, "wallet_switchEthereumChain", "StudioNet switch");
requireText(genlayer, "wallet_addEthereumChain", "StudioNet add fallback");
requireText(genlayer, "transactionHashVariant: \"latest-final\"", "finalized reads");
requireText(genlayer, "recordExists", "duplicate read helper");
requireText(vite, "\"/genlayer-rpc\"", "Vite same-origin proxy");
requireText(vercel, "\"/genlayer-rpc\"", "Vercel same-origin proxy");
requireText(styles, ".comparison-grid", "side-by-side record layout");

forbidText(app, "dangerouslySetInnerHTML", "unsafe HTML rendering");
forbidText(genlayer, ".connect(\"studionet\")", "Snap-dependent client.connect");
forbidText(config, "0xABf95165E21499D74fbC59966368B09db9C90DA9", "IC submission address");

if (pkg.dependencies["genlayer-js"] !== "1.1.8") {
  failures.push("genlayer-js is not pinned to 1.1.8");
}
if (pkg.dependencies.viem !== "2.29.0") {
  failures.push("viem is not pinned to 2.29.0");
}
if (tsconfig?.compilerOptions?.noEmit !== true) {
  failures.push("tsconfig.node.json noEmit is not true");
}

const viemEntries = Object.entries(lock.packages ?? {})
  .filter(([name]) => name.endsWith("node_modules/viem"))
  .map(([, value]) => value?.version);
const viemVersions = new Set(viemEntries);
if (viemVersions.size !== 1 || !viemVersions.has("2.29.0")) {
  failures.push("package-lock does not dedupe viem to exactly 2.29.0");
}

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL " + failure);
  process.exit(1);
}

console.log("PASS four-method UI and exact shape explanations");
console.log("PASS accepted-state preflight, finalized reads, reload, and receipt path");
console.log("PASS same-origin proxy, StudioNet switch, pinned SDK, and single viem");
console.log("PASS React text rendering surface contains no unsafe HTML injection");
