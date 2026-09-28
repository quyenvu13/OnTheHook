import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleAlert,
  CircleDot,
  Clipboard,
  ExternalLink,
  FilePlus2,
  Fingerprint,
  GitCompareArrows,
  History,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";
import { isAddress } from "viem";
import {
  CONTRACT_ADDRESS,
  CONTRACT_EXPLORER_URL,
  DEPLOY_EXPLORER_URL,
  DEPLOY_TX,
  EXPLORER_BASE,
  MAX_LABEL_LENGTH,
  MAX_LOG_ENTRIES,
  MAX_NOTE_LENGTH,
  MAX_TEXT_LENGTH,
  SAFE_CALLDATA_BYTES,
  SOURCE_SHA256,
  STUDIONET_CHAIN_ID
} from "./lib/config";
import { errorMessage } from "./lib/errors";
import {
  ensureStudioNet,
  getConnectedWallet,
  getLimits,
  getTransactionVerdict,
  loadRecordBundle,
  openCalldataBytes,
  recordExists,
  requestWallet,
  writeMethod
} from "./lib/genlayer";
import {
  normalizeId,
  pyLen,
  pyStrip,
  shortAddress,
  undertakingId,
  validId
} from "./lib/id.js";
import type {
  Limits,
  LogEntry,
  TxState,
  Undertaking
} from "./lib/types";

type View = "records" | "open" | "proof";
type SlotKey = "left" | "right";
type ActionName = "claim_discharge" | "rebut" | "log_entry";

interface RecordSlot {
  key: SlotKey;
  input: string;
  record: Undertaking | null;
  logs: LogEntry[];
  loading: boolean;
  error: string;
}

interface ActionDraft {
  slot: SlotKey;
  method: ActionName;
}

interface Rule {
  enabled: boolean;
  reason: string;
}

const RESULT_LOG_DISABLED =
  "This undertaking is discharged by a claim, not by a log";
const EFFORT_CLAIM_DISABLED =
  "This is a standing obligation; add a log entry instead";

const EMPTY_TX: TxState = {
  kind: "idle",
  message: "No transaction submitted in this session."
};

function emptySlot(key: SlotKey): RecordSlot {
  return {
    key,
    input: "",
    record: null,
    logs: [],
    loading: false,
    error: ""
  };
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function lower(value: string) {
  return value.toLowerCase();
}

function sameWallet(a: string, b: string) {
  return Boolean(a && b && lower(a) === lower(b));
}

function claimRule(record: Undertaking, account: string): Rule {
  if (record.kind !== "RESULT") {
    return { enabled: false, reason: EFFORT_CLAIM_DISABLED };
  }
  if (!sameWallet(account, record.author)) {
    return { enabled: false, reason: "Only the author may claim discharge" };
  }
  if (record.state !== "OPEN") {
    return { enabled: false, reason: "Discharge has already been claimed" };
  }
  return { enabled: true, reason: "Author · one permanent claim" };
}

function rebutRule(record: Undertaking, account: string): Rule {
  if (record.kind !== "RESULT") {
    return { enabled: false, reason: EFFORT_CLAIM_DISABLED };
  }
  if (!sameWallet(account, record.other_wallet)) {
    return { enabled: false, reason: "Only the named other side may rebut" };
  }
  if (record.state !== "CLAIMED") {
    return { enabled: false, reason: "There is no claim to rebut" };
  }
  return { enabled: true, reason: "Other side · one permanent rebuttal" };
}

function logRule(record: Undertaking, account: string): Rule {
  if (record.kind !== "EFFORT") {
    return { enabled: false, reason: RESULT_LOG_DISABLED };
  }
  if (
    !sameWallet(account, record.author)
    && !sameWallet(account, record.other_wallet)
  ) {
    return {
      enabled: false,
      reason: "Only the two named sides may add log entries"
    };
  }
  if (record.log_count >= MAX_LOG_ENTRIES) {
    return { enabled: false, reason: "Log is full" };
  }
  return { enabled: true, reason: "Either named side · append-only" };
}

function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}

function txUrl(hash: string) {
  return EXPLORER_BASE + "/tx/" + hash;
}

function roleFor(record: Undertaking, account: string) {
  if (sameWallet(account, record.author)) return "AUTHOR";
  if (sameWallet(account, record.other_wallet)) return "OTHER SIDE";
  return account ? "OBSERVER" : "WALLET NOT CONNECTED";
}

function StateBadge({ value }: { value: string }) {
  const tone = value === "RUNNING"
    ? "running"
    : value === "SETTLED"
      ? "settled"
      : value === "CLAIMED"
        ? "claimed"
        : "open";
  return <span className={"state-badge " + tone}>{value}</span>;
}

interface RecordCardProps {
  slot: RecordSlot;
  account: string;
  selected: boolean;
  busy: boolean;
  action: ActionDraft | null;
  actionNote: string;
  onSelect: () => void;
  onInput: (value: string) => void;
  onLoad: () => void;
  onRefresh: () => void;
  onClear: () => void;
  onOpenAnother: () => void;
  onAction: (method: ActionName) => void;
  onActionNote: (value: string) => void;
  onCancelAction: () => void;
  onSubmitAction: () => void;
}

function RecordCard({
  slot,
  account,
  selected,
  busy,
  action,
  actionNote,
  onSelect,
  onInput,
  onLoad,
  onRefresh,
  onClear,
  onOpenAnother,
  onAction,
  onActionNote,
  onCancelAction,
  onSubmitAction
}: RecordCardProps) {
  const record = slot.record;
  const currentAction = action?.slot === slot.key ? action.method : null;

  if (!record) {
    return (
      <section
        className={"record-slot empty " + (selected ? "selected" : "")}
        onClick={onSelect}
      >
        <div className="slot-index">{slot.key === "left" ? "01" : "02"}</div>
        <div className="empty-slot-copy">
          <GitCompareArrows />
          <h2>{slot.key === "left" ? "First record" : "Second record"}</h2>
          <p>Load a real 64-character undertaking ID from this contract.</p>
        </div>
        <label className="load-field">
          <span>Undertaking ID</span>
          <div>
            <input
              value={slot.input}
              onChange={(event) => onInput(event.target.value)}
              placeholder="64 hex characters"
              spellCheck={false}
              aria-label={(slot.key === "left" ? "First" : "Second") + " undertaking ID"}
            />
            <button
              className="square-button"
              onClick={(event) => {
                event.stopPropagation();
                onLoad();
              }}
              disabled={slot.loading}
              aria-label="Load record"
            >
              {slot.loading ? <LoaderCircle className="spin" /> : <ArrowRight />}
            </button>
          </div>
        </label>
        {slot.error && <p className="inline-error">{slot.error}</p>}
      </section>
    );
  }

  const claim = claimRule(record, account);
  const rebut = rebutRule(record, account);
  const log = logRule(record, account);
  const isResult = record.kind === "RESULT";

  return (
    <section
      className={
        "record-slot loaded "
        + record.kind.toLowerCase()
        + " "
        + (selected ? "selected" : "")
      }
      onClick={onSelect}
    >
      <div className="record-toolbar">
        <div className="slot-index">{slot.key === "left" ? "01" : "02"}</div>
        <div className="toolbar-actions">
          <button
            className="icon-button"
            onClick={(event) => {
              event.stopPropagation();
              onRefresh();
            }}
            aria-label="Refresh accepted state"
            disabled={slot.loading}
          >
            <RefreshCw className={slot.loading ? "spin" : ""} />
          </button>
          <button
            className="icon-button"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            aria-label="Clear record"
          >
            <X />
          </button>
        </div>
      </div>

      <header className="record-heading">
        <div>
          <p className="micro-label">SEMANTIC RECORD / {record.kind}</p>
          <h2>{isResult ? "An end state is owed." : "A manner of work is owed."}</h2>
        </div>
        <StateBadge value={record.state} />
      </header>

      <blockquote>{record.text}</blockquote>

      <div className="record-meta">
        <div>
          <span>AUTHOR</span>
          <button onClick={() => copyText(record.author)}>
            {shortAddress(record.author, 9, 6)} <Clipboard />
          </button>
        </div>
        <div>
          <span>{record.other_label.toUpperCase()}</span>
          <button onClick={() => copyText(record.other_wallet)}>
            {shortAddress(record.other_wallet, 9, 6)} <Clipboard />
          </button>
        </div>
        <div>
          <span>CONNECTED ROLE</span>
          <strong>{roleFor(record, account)}</strong>
        </div>
        <div>
          <span>VERDICT</span>
          <strong>{record.outcome}</strong>
        </div>
      </div>

      {isResult ? (
        <div className="result-shape">
          <div className="shape-title">
            <Scale />
            <div>
              <strong>Closed pair</strong>
              <span>Claim once. Rebut once.</span>
            </div>
          </div>
          <div className="paired-boxes">
            <article className={record.claim_note ? "filled" : ""}>
              <span>01 / CLAIM</span>
              <p>{record.claim_note || "No claim recorded."}</p>
            </article>
            <article className={record.rebut_note ? "filled" : ""}>
              <span>02 / REBUTTAL</span>
              <p>{record.rebut_note || "No rebuttal recorded."}</p>
            </article>
          </div>
          <div className="shape-count">
            Claim: {record.claim_note ? "1" : "0"} of 1
            <i />
            Rebuttal: {record.rebut_note ? "1" : "0"} of 1
          </div>
        </div>
      ) : (
        <div className="effort-shape">
          <div className="shape-title">
            <History />
            <div>
              <strong>Two-sided standing log</strong>
              <span>This record has no completed state.</span>
            </div>
          </div>
          <ol className="log-list">
            {slot.logs.length === 0 && (
              <li className="empty-log">No entries yet. Either named side may write first.</li>
            )}
            {slot.logs.map((entry) => (
              <li key={entry.index}>
                <span className="log-index">
                  {String(entry.index).padStart(2, "0")}
                </span>
                <div>
                  <p>{entry.note}</p>
                  <button onClick={() => copyText(entry.by)}>
                    BY {shortAddress(entry.by, 8, 6)} <Clipboard />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="shape-count">
            Log: {record.log_count} {record.log_count === 1 ? "entry" : "entries"}, no end state
          </div>
        </div>
      )}

      <div className="id-strip">
        <Fingerprint />
        <code>{record.undertaking_id}</code>
        <button onClick={() => copyText(record.undertaking_id)} aria-label="Copy undertaking ID">
          <Clipboard />
        </button>
      </div>

      <div className="action-heading">
        <p className="micro-label">METHOD SURFACE / ALL FOUR STAY VISIBLE</p>
        <span>Disabled methods explain the record shape.</span>
      </div>
      <div className="action-grid">
        <div>
          <button className="method-button open-new" onClick={onOpenAnother}>
            <FilePlus2 /> Open another
          </button>
          <small>Creates a new semantic record</small>
        </div>
        <div>
          <button
            className="method-button"
            disabled={!claim.enabled || busy}
            onClick={() => onAction("claim_discharge")}
          >
            <Check /> Claim discharge
          </button>
          <small className={!claim.enabled ? "blocked" : ""}>{claim.reason}</small>
        </div>
        <div>
          <button
            className="method-button"
            disabled={!rebut.enabled || busy}
            onClick={() => onAction("rebut")}
          >
            <Scale /> Rebut claim
          </button>
          <small className={!rebut.enabled ? "blocked" : ""}>{rebut.reason}</small>
        </div>
        <div>
          <button
            className="method-button"
            disabled={!log.enabled || busy}
            onClick={() => onAction("log_entry")}
          >
            <Plus /> Add log entry
          </button>
          <small className={!log.enabled ? "blocked" : ""}>{log.reason}</small>
        </div>
      </div>

      {currentAction && (
        <div className="action-editor">
          <div>
            <span>{currentAction.replace("_", " ").toUpperCase()}</span>
            <button onClick={onCancelAction}><X /> Cancel</button>
          </div>
          <textarea
            value={actionNote}
            onChange={(event) => onActionNote(event.target.value)}
            placeholder="Permanent note for this on-chain action"
            maxLength={MAX_NOTE_LENGTH}
          />
          <footer>
            <span>{pyLen(actionNote)} / {MAX_NOTE_LENGTH} code points</span>
            <button
              className="primary-button"
              onClick={onSubmitAction}
              disabled={busy || !pyStrip(actionNote)}
            >
              {busy ? <LoaderCircle className="spin" /> : <LockKeyhole />}
              Sign & submit
            </button>
          </footer>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [view, setView] = useState<View>("records");
  const [account, setAccount] = useState("");
  const [limits, setLimits] = useState<Limits | null>(null);
  const [protocolError, setProtocolError] = useState("");
  const [left, setLeft] = useState<RecordSlot>(emptySlot("left"));
  const [right, setRight] = useState<RecordSlot>(emptySlot("right"));
  const [selected, setSelected] = useState<SlotKey>("left");
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<TxState>(EMPTY_TX);
  const [action, setAction] = useState<ActionDraft | null>(null);
  const [actionNote, setActionNote] = useState("");

  const [otherWallet, setOtherWallet] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const [undertakingText, setUndertakingText] = useState("");

  useEffect(() => {
    getConnectedWallet().then(setAccount).catch(() => undefined);
    getLimits()
      .then(setLimits)
      .catch((error) => setProtocolError(errorMessage(error)));

    const savedLeft = window.localStorage.getItem("onthehook:left") ?? "";
    const savedRight = window.localStorage.getItem("onthehook:right") ?? "";
    if (savedLeft) setLeft((slot) => ({ ...slot, input: savedLeft }));
    if (savedRight) setRight((slot) => ({ ...slot, input: savedRight }));

    if (!window.ethereum?.on) return;
    const onAccounts = (accounts: string[]) => {
      setAccount(accounts?.[0] ?? "");
      setTx({
        kind: "idle",
        message: "Wallet changed. Reload accepted state before writing."
      });
    };
    const onChain = () => {
      setTx({
        kind: "idle",
        message: "Network changed. On-chain records remain visible; reconnect before writing."
      });
    };
    window.ethereum.on("accountsChanged", onAccounts as any);
    window.ethereum.on("chainChanged", onChain as any);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts as any);
      window.ethereum?.removeListener?.("chainChanged", onChain as any);
    };
  }, []);

  const calldataBytes = useMemo(
    () => openCalldataBytes(otherWallet, otherLabel, undertakingText),
    [otherWallet, otherLabel, undertakingText]
  );

  const openFormError = useMemo(() => {
    if (!account) return "Connect the author wallet first.";
    if (!isAddress(otherWallet)) return "Enter a valid other-side wallet.";
    if (sameWallet(account, otherWallet)) return "The other side cannot be the author.";
    if (!pyStrip(otherLabel)) return "Enter a label for the other side.";
    if (pyLen(pyStrip(otherLabel)) > MAX_LABEL_LENGTH) {
      return "Other-side label is too long.";
    }
    if (!pyStrip(undertakingText)) return "Enter the undertaking text.";
    if (pyLen(pyStrip(undertakingText)) > MAX_TEXT_LENGTH) {
      return "Undertaking text is too long.";
    }
    if (calldataBytes > SAFE_CALLDATA_BYTES) {
      return "The serialized call exceeds the 255-byte tested transport envelope.";
    }
    return "";
  }, [account, otherWallet, otherLabel, undertakingText, calldataBytes]);

  function updateSlot(key: SlotKey, update: (slot: RecordSlot) => RecordSlot) {
    if (key === "left") setLeft(update);
    else setRight(update);
  }

  function currentSlot(key: SlotKey) {
    return key === "left" ? left : right;
  }

  async function connectWallet() {
    try {
      const wallet = await requestWallet();
      setAccount(wallet);
      setTx({ kind: "success", message: "Wallet connected to GenLayer StudioNet." });
    } catch (error) {
      setTx({ kind: "error", message: errorMessage(error) });
    }
  }

  async function loadSlot(key: SlotKey, idValue?: string, announce = true) {
    const raw = idValue ?? currentSlot(key).input;
    const id = normalizeId(raw);
    if (!validId(id)) {
      updateSlot(key, (slot) => ({
        ...slot,
        error: "Enter a valid 64-character undertaking ID."
      }));
      return null;
    }
    updateSlot(key, (slot) => ({
      ...slot,
      input: id,
      loading: true,
      error: ""
    }));
    try {
      const bundle = await loadRecordBundle(id);
      updateSlot(key, (slot) => ({
        ...slot,
        input: id,
        record: bundle.record,
        logs: bundle.logs,
        loading: false,
        error: ""
      }));
      window.localStorage.setItem("onthehook:" + key, id);
      if (announce) {
        setTx({
          kind: "success",
          message: "Latest finalized record state loaded.",
          undertakingId: id
        });
      }
      return bundle;
    } catch (error) {
      const message = errorMessage(error);
      updateSlot(key, (slot) => ({
        ...slot,
        loading: false,
        error: message
      }));
      if (announce) setTx({ kind: "error", message });
      return null;
    }
  }

  function clearSlot(key: SlotKey) {
    window.localStorage.removeItem("onthehook:" + key);
    updateSlot(key, () => emptySlot(key));
    if (action?.slot === key) {
      setAction(null);
      setActionNote("");
    }
  }

  async function verifyAcceptedState(
    hash: string,
    id: string,
    key: SlotKey,
    accepted: (record: Undertaking) => boolean
  ) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await delay(attempt === 0 ? 2500 : 5000);
      try {
        const bundle = await loadRecordBundle(id);
        updateSlot(key, (slot) => ({
          ...slot,
          input: id,
          record: bundle.record,
          logs: bundle.logs,
          loading: false,
          error: ""
        }));
        if (accepted(bundle.record)) {
          window.localStorage.setItem("onthehook:" + key, id);
          setTx({
            kind: "success",
            hash,
            undertakingId: id,
            message: "Accepted state changed as expected. The write is verified."
          });
          return;
        }
      } catch {
        // Opening writes are unreadable until accepted; keep polling.
      }
    }

    try {
      const verdict = await getTransactionVerdict(hash);
      if (verdict.kind === "error") {
        setTx({
          kind: "error",
          hash,
          undertakingId: id,
          message: "Transaction rolled back: " + verdict.reason
        });
        return;
      }
      setTx({
        kind: "submitted",
        hash,
        undertakingId: id,
        message: verdict.kind === "executed"
          ? "Execution succeeded, but accepted state is not visible yet. Confirmation is delayed."
          : "Submitted — confirmation delayed. Do not send the action again blindly."
      });
    } catch {
      setTx({
        kind: "submitted",
        hash,
        undertakingId: id,
        message: "Submitted — confirmation delayed. Inspect Explorer, then refresh this record."
      });
    }
  }

  async function runWrite(
    method: string,
    args: unknown[],
    id: string,
    key: SlotKey,
    accepted: (record: Undertaking) => boolean
  ) {
    if (!account) {
      setTx({ kind: "error", message: "Connect a wallet first." });
      return;
    }
    if (busy) return;
    setBusy(true);
    setTx({ kind: "signing", message: "Confirm the transaction in MetaMask." });
    try {
      await ensureStudioNet();
      const hash = await writeMethod(account, method, args);
      updateSlot(key, (slot) => ({ ...slot, input: id }));
      setView("records");
      setSelected(key);
      setTx({
        kind: "submitted",
        hash,
        undertakingId: id,
        message: "Submitted. Waiting for consensus and accepted-state proof."
      });
      await verifyAcceptedState(hash, id, key, accepted);
    } catch (error) {
      setTx({ kind: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function submitOpen() {
    if (openFormError) {
      setTx({ kind: "error", message: openFormError });
      return;
    }
    const id = undertakingId(account, undertakingText);
    setBusy(true);
    setTx({
      kind: "submitted",
      undertakingId: id,
      message: "Checking latest finalized state for a duplicate before sending."
    });
    try {
      const duplicate = await recordExists(id);
      if (duplicate) {
        const key = left.record ? "right" : "left";
        await loadSlot(key, id, false);
        setView("records");
        setSelected(key);
        setTx({
          kind: "error",
          undertakingId: id,
          message: "Undertaking already exists. No transaction was sent."
        });
        return;
      }
    } catch (error) {
      setTx({
        kind: "error",
        undertakingId: id,
        message: "Duplicate preflight failed: " + errorMessage(error)
      });
      return;
    } finally {
      setBusy(false);
    }

    const key: SlotKey = !left.record
      ? "left"
      : !right.record
        ? "right"
        : selected;
    await runWrite(
      "open_undertaking",
      [otherWallet, otherLabel, undertakingText],
      id,
      key,
      (record) => record.undertaking_id === id
    );
  }

  function beginAction(slot: SlotKey, method: ActionName) {
    setSelected(slot);
    setAction({ slot, method });
    setActionNote("");
  }

  async function submitAction() {
    if (!action) return;
    const slot = currentSlot(action.slot);
    const record = slot.record;
    if (!record) return;
    const note = pyStrip(actionNote);
    if (!note) {
      setTx({ kind: "error", message: "Note cannot be empty." });
      return;
    }
    const beforeLogCount = record.log_count;
    const method = action.method;
    setAction(null);
    setActionNote("");
    await runWrite(
      method,
      [record.undertaking_id, note],
      record.undertaking_id,
      action.slot,
      (next) => {
        if (method === "claim_discharge") {
          return next.state === "CLAIMED" && Boolean(next.claim_note);
        }
        if (method === "rebut") {
          return next.state === "SETTLED" && Boolean(next.rebut_note);
        }
        return next.log_count > beforeLogCount;
      }
    );
  }

  const bothLoaded = Boolean(left.record && right.record);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("records")}>
          <img src="/onthehook-mark.svg" alt="" />
          <span>
            <strong>OnTheHook</strong>
            <small>SEMANTIC RECORD SHAPES</small>
          </span>
        </button>

        <nav aria-label="Primary navigation">
          <button
            className={view === "records" ? "active" : ""}
            onClick={() => setView("records")}
          >
            <span>01</span> Records
          </button>
          <button
            className={view === "open" ? "active" : ""}
            onClick={() => setView("open")}
          >
            <span>02</span> Open
          </button>
          <button
            className={view === "proof" ? "active" : ""}
            onClick={() => setView("proof")}
          >
            <span>03</span> Proof
          </button>
        </nav>

        <button className="wallet-button" onClick={connectWallet}>
          <Wallet />
          {account ? shortAddress(account, 7, 5) : "Connect wallet"}
        </button>
      </header>

      <div className="network-strip">
        <span><i /> STUDIONET / {STUDIONET_CHAIN_ID}</span>
        <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">
          CONTRACT {shortAddress(CONTRACT_ADDRESS, 8, 6)} <ExternalLink />
        </a>
        <span>FINALIZED READS · NO MONEY · NO PREVIEW</span>
      </div>

      {tx.kind !== "idle" && (
        <div className={"tx-banner " + tx.kind} role="status">
          {tx.kind === "success" ? <Check /> : tx.kind === "error" ? <CircleAlert /> : <LoaderCircle className={tx.kind === "signing" || tx.kind === "submitted" ? "spin" : ""} />}
          <div>
            <strong>{tx.kind.toUpperCase()}</strong>
            <p>{tx.message}</p>
            {tx.undertakingId && (
              <button onClick={() => copyText(tx.undertakingId || "")}>
                ID {shortAddress(tx.undertakingId, 12, 10)} <Clipboard />
              </button>
            )}
          </div>
          {tx.hash && (
            <a href={txUrl(tx.hash)} target="_blank" rel="noreferrer">
              Explorer <ExternalLink />
            </a>
          )}
          <button className="banner-close" onClick={() => setTx(EMPTY_TX)} aria-label="Dismiss">
            <X />
          </button>
        </div>
      )}

      <main>
        {view === "records" && (
          <>
            <section className="records-hero">
              <div>
                <p className="eyebrow">THE VERDICT CHANGES THE RECORD</p>
                <h1>
                  Same promise.<br />
                  <em>Different shape.</em>
                </h1>
              </div>
              <div className="hero-explainer">
                <p>
                  GenLayer decides whether the author owes an end state or a
                  manner of work. Everything after that verdict is deterministic.
                </p>
                <div className="shape-legend">
                  <span><Scale /> RESULT <b>claim + rebuttal</b></span>
                  <span><History /> EFFORT <b>two-sided standing log</b></span>
                </div>
              </div>
            </section>

            <div className={"comparison-bar " + (bothLoaded ? "ready" : "")}>
              <span>COMPARE DECK</span>
              <p>
                {bothLoaded
                  ? "Two live records loaded. Their method surfaces can now be compared directly."
                  : "Load one or two real IDs. Empty slots contain no seeded data."}
              </p>
              <GitCompareArrows />
            </div>

            <section className="comparison-grid">
              <RecordCard
                slot={left}
                account={account}
                selected={selected === "left"}
                busy={busy}
                action={action}
                actionNote={actionNote}
                onSelect={() => setSelected("left")}
                onInput={(value) => setLeft((slot) => ({ ...slot, input: value }))}
                onLoad={() => loadSlot("left")}
                onRefresh={() => loadSlot("left", left.record?.undertaking_id)}
                onClear={() => clearSlot("left")}
                onOpenAnother={() => setView("open")}
                onAction={(method) => beginAction("left", method)}
                onActionNote={setActionNote}
                onCancelAction={() => setAction(null)}
                onSubmitAction={submitAction}
              />
              <RecordCard
                slot={right}
                account={account}
                selected={selected === "right"}
                busy={busy}
                action={action}
                actionNote={actionNote}
                onSelect={() => setSelected("right")}
                onInput={(value) => setRight((slot) => ({ ...slot, input: value }))}
                onLoad={() => loadSlot("right")}
                onRefresh={() => loadSlot("right", right.record?.undertaking_id)}
                onClear={() => clearSlot("right")}
                onOpenAnother={() => setView("open")}
                onAction={(method) => beginAction("right", method)}
                onActionNote={setActionNote}
                onCancelAction={() => setAction(null)}
                onSubmitAction={submitAction}
              />
            </section>
          </>
        )}

        {view === "open" && (
          <section className="open-layout">
            <div className="open-intro">
              <p className="eyebrow">ONE SEMANTIC DECISION</p>
              <h1>Put the promise <em>on the record.</em></h1>
              <p className="intro-copy">
                The connected wallet becomes the author. A validator consensus
                classifies the text once. There is no preview and no re-roll.
              </p>
              <ol className="open-steps">
                <li><span>01</span><div><strong>Write</strong><p>Identify the other side and enter the promise.</p></div></li>
                <li><span>02</span><div><strong>Classify</strong><p>Consensus returns RESULT_OWED or EFFORT_OWED.</p></div></li>
                <li><span>03</span><div><strong>Shape</strong><p>The verdict permanently selects a closed pair or standing log.</p></div></li>
              </ol>
            </div>

            <form
              className="open-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitOpen();
              }}
            >
              <div className="form-title">
                <FilePlus2 />
                <div>
                  <span>OPEN_UNDERTAKING</span>
                  <h2>New semantic record</h2>
                </div>
              </div>

              <div className="author-lock">
                <LockKeyhole />
                <div>
                  <span>AUTHOR / CONNECTED WALLET</span>
                  <strong>{account || "Not connected"}</strong>
                </div>
              </div>

              <label>
                <span>OTHER-SIDE WALLET</span>
                <input
                  value={otherWallet}
                  onChange={(event) => setOtherWallet(event.target.value)}
                  placeholder="0x…"
                  spellCheck={false}
                />
              </label>

              <label>
                <span>OTHER-SIDE LABEL</span>
                <input
                  value={otherLabel}
                  onChange={(event) => setOtherLabel(event.target.value)}
                  placeholder="e.g. the Client"
                  maxLength={MAX_LABEL_LENGTH}
                />
                <small>{pyLen(otherLabel)} / {MAX_LABEL_LENGTH} code points</small>
              </label>

              <label>
                <span>UNDERTAKING TEXT</span>
                <textarea
                  value={undertakingText}
                  onChange={(event) => setUndertakingText(event.target.value)}
                  placeholder="Write the binding promise exactly as it should be classified."
                  maxLength={MAX_TEXT_LENGTH}
                />
                <small>{pyLen(undertakingText)} / {MAX_TEXT_LENGTH} code points</small>
              </label>

              <div className={"calldata-meter " + (calldataBytes > SAFE_CALLDATA_BYTES ? "over" : "")}>
                <div>
                  <Activity />
                  <span>
                    SERIALIZED CALL
                    <strong>{calldataBytes} / {SAFE_CALLDATA_BYTES} bytes tested</strong>
                  </span>
                </div>
                <div className="meter-track">
                  <i style={{ width: Math.min(100, calldataBytes / SAFE_CALLDATA_BYTES * 100) + "%" }} />
                </div>
                <p>
                  The contract accepts up to 600 code points, but this StudioNet
                  transport path is only treated as proven inside the tested byte envelope.
                </p>
              </div>

              {openFormError && <p className="form-error"><CircleAlert /> {openFormError}</p>}

              <button
                className="primary-button submit-open"
                type="submit"
                disabled={Boolean(openFormError) || busy}
              >
                {busy ? <LoaderCircle className="spin" /> : <ShieldCheck />}
                Classify & open
                <ArrowRight />
              </button>
            </form>
          </section>
        )}

        {view === "proof" && (
          <section className="proof-layout">
            <div className="proof-heading">
              <p className="eyebrow">REPRODUCIBLE PROOF</p>
              <h1>Trust the chain, <em>not the page.</em></h1>
              <p>
                The app reads finalized StudioNet state through a same-origin
                proxy. Contract code is frozen to the hash shown below.
              </p>
            </div>

            <div className="proof-grid">
              <article className="proof-card contract-proof">
                <div className="proof-icon"><BookOpenCheck /></div>
                <span>CONTRACT</span>
                <h2>OutcomeOwed v{limits?.version || "1.0"}</h2>
                <code>{CONTRACT_ADDRESS}</code>
                <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">
                  Inspect contract <ExternalLink />
                </a>
              </article>

              <article className="proof-card">
                <div className="proof-icon"><Fingerprint /></div>
                <span>CANONICAL SOURCE SHA-256</span>
                <code>{SOURCE_SHA256}</code>
                <button onClick={() => copyText(SOURCE_SHA256)}>
                  Copy hash <Clipboard />
                </button>
              </article>

              <article className="proof-card">
                <div className="proof-icon"><Activity /></div>
                <span>DEPLOY TRANSACTION</span>
                <code>{DEPLOY_TX}</code>
                <a href={DEPLOY_EXPLORER_URL} target="_blank" rel="noreferrer">
                  Inspect deployment <ExternalLink />
                </a>
              </article>

              <article className="proof-card protocol-card">
                <div className="proof-icon"><ShieldCheck /></div>
                <span>LIVE PROTOCOL FLAGS</span>
                {protocolError ? (
                  <p className="inline-error">{protocolError}</p>
                ) : (
                  <ul>
                    <li><Check /> No global admin</li>
                    <li><Check /> No external web</li>
                    <li><Check /> No money custody</li>
                    <li><Check /> No preview endpoint</li>
                  </ul>
                )}
                <small>Rubric {shortAddress(limits?.rubric_hash || "", 12, 10)}</small>
              </article>
            </div>

            <div className="proof-note">
              <CircleDot />
              <div>
                <strong>What this contract proves</strong>
                <p>
                  It binds one semantic verdict to a deterministic record shape.
                  It does not prove off-chain performance, identity, payment, or truth.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>OnTheHook / GenLayer StudioNet</span>
        <span>RESULT → CLOSED PAIR · EFFORT → STANDING LOG</span>
        <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">
          Verify on Explorer <ExternalLink />
        </a>
      </footer>
    </div>
  );
}
