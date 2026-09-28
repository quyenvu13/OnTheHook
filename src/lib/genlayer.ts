import { abi, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { isAddress } from "viem";
import {
  CONTRACT_ADDRESS,
  RPC_PATH,
  STUDIO_WALLET_RPC,
  STUDIONET_CHAIN_HEX,
  STUDIONET_CHAIN_ID
} from "./config";
import { containsMessage } from "./errors";
import { receiptVerdict } from "./receipt.js";
import type {
  Limits,
  LogEntry,
  RecordBundle,
  Undertaking
} from "./types";

const WALLET_METHODS = new Set([
  "eth_accounts",
  "eth_requestAccounts",
  "eth_sendTransaction",
  "eth_signTransaction",
  "personal_sign",
  "eth_signTypedData_v4"
]);

function proxiedChain() {
  const chain: any = studionet as any;
  return {
    ...chain,
    rpcUrls: {
      ...(chain.rpcUrls ?? {}),
      default: { http: [RPC_PATH] },
      public: { http: [RPC_PATH] }
    }
  };
}

const readClient: any = createClient({ chain: proxiedChain() } as any);

function ethereum() {
  if (!window.ethereum) throw new Error("MetaMask was not found.");
  return window.ethereum;
}

function walletCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  const raw = (error as { code?: unknown }).code;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizeUndertaking(raw: any): Undertaking {
  return {
    undertaking_id: String(raw?.undertaking_id ?? ""),
    author: String(raw?.author ?? ""),
    other_wallet: String(raw?.other_wallet ?? ""),
    other_label: String(raw?.other_label ?? ""),
    text: String(raw?.text ?? ""),
    outcome_code: asNumber(raw?.outcome_code),
    outcome: String(raw?.outcome ?? "EFFORT_OWED") as Undertaking["outcome"],
    kind: String(raw?.kind ?? "EFFORT") as Undertaking["kind"],
    state: String(raw?.state ?? "RUNNING") as Undertaking["state"],
    claim_note: String(raw?.claim_note ?? ""),
    rebut_note: String(raw?.rebut_note ?? ""),
    log_count: asNumber(raw?.log_count)
  };
}

function normalizeLog(raw: any): LogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    index: asNumber(entry?.index),
    note: String(entry?.note ?? ""),
    by: String(entry?.by ?? "")
  }));
}

function normalizeLimits(raw: any): Limits {
  return {
    contract_name: String(raw?.contract_name ?? ""),
    version: String(raw?.version ?? ""),
    semantic_outcomes: asStrings(raw?.semantic_outcomes),
    result_states: asStrings(raw?.result_states),
    effort_states: asStrings(raw?.effort_states),
    max_text_length: asNumber(raw?.max_text_length),
    max_label_length: asNumber(raw?.max_label_length),
    max_note_length: asNumber(raw?.max_note_length),
    max_log_entries: asNumber(raw?.max_log_entries),
    max_page_size: asNumber(raw?.max_page_size),
    global_admin: Boolean(raw?.global_admin),
    clock_used: Boolean(raw?.clock_used),
    external_web_used: Boolean(raw?.external_web_used),
    money_used: Boolean(raw?.money_used),
    preview_endpoint_exposed: Boolean(raw?.preview_endpoint_exposed),
    wallet_identity_verified: Boolean(raw?.wallet_identity_verified),
    rubric_hash: String(raw?.rubric_hash ?? "")
  };
}

function readArgs(functionName: string, args: unknown[] = []) {
  return {
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    stateStatus: "accepted",
    transactionHashVariant: "latest-final"
  } as any;
}

export async function getConnectedWallet(): Promise<string> {
  if (!window.ethereum) return "";
  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
  return accounts?.[0] ?? "";
}

export async function ensureStudioNet(): Promise<void> {
  const provider = ethereum();
  const currentHex = await provider.request({ method: "eth_chainId" }) as string;
  const current = typeof currentHex === "string"
    ? Number.parseInt(currentHex, 16)
    : 0;
  if (current === STUDIONET_CHAIN_ID) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_HEX }]
    });
    return;
  } catch (error) {
    if (walletCode(error) === 4001) {
      throw new Error("The network switch was rejected.");
    }
    if (walletCode(error) !== 4902) throw error;
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: STUDIONET_CHAIN_HEX,
      chainName: (studionet as any).name ?? "GenLayer StudioNet",
      rpcUrls: [STUDIO_WALLET_RPC],
      nativeCurrency: (studionet as any).nativeCurrency ?? {
        name: "GEN Token",
        symbol: "GEN",
        decimals: 18
      }
    }]
  });

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: STUDIONET_CHAIN_HEX }]
  });
}

export async function requestWallet(): Promise<string> {
  const provider = ethereum();
  const accounts = await provider.request({
    method: "eth_requestAccounts"
  }) as string[];
  if (!accounts?.[0]) throw new Error("No wallet account was returned.");
  await ensureStudioNet();
  return accounts[0];
}

function walletClient(account: string) {
  const provider = ethereum();
  const limitedProvider = {
    request: (request: { method: string; params?: unknown[] }) => {
      if (!WALLET_METHODS.has(request.method)) {
        throw new Error("Unsupported wallet transport method: " + request.method);
      }
      return provider.request(request);
    }
  };
  return createClient({
    chain: proxiedChain(),
    account: account as any,
    provider: limitedProvider as any
  } as any) as any;
}

export async function getLimits(): Promise<Limits> {
  const raw = await readClient.readContract(readArgs("get_limits"));
  return normalizeLimits(raw);
}

export async function getUndertaking(id: string): Promise<Undertaking> {
  const raw = await readClient.readContract(readArgs("get_undertaking", [id]));
  return normalizeUndertaking(raw);
}

export async function getLog(id: string): Promise<LogEntry[]> {
  const raw = await readClient.readContract(readArgs("get_log", [id, 0, 50]));
  return normalizeLog(raw);
}

export async function loadRecordBundle(id: string): Promise<RecordBundle> {
  const record = await getUndertaking(id);
  const logs = record.kind === "EFFORT" ? await getLog(id) : [];
  return { record, logs };
}

export async function recordExists(id: string): Promise<boolean> {
  try {
    await getUndertaking(id);
    return true;
  } catch (error) {
    if (containsMessage(error, "Undertaking not found")) return false;
    throw error;
  }
}

export async function writeMethod(
  account: string,
  functionName: string,
  args: unknown[]
): Promise<string> {
  const result = await walletClient(account).writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n
  });
  if (typeof result === "string") return result;
  if (typeof result?.hash === "string") return result.hash;
  if (typeof result?.transactionHash === "string") return result.transactionHash;
  throw new Error("The wallet did not return a transaction hash.");
}

export async function getTransactionVerdict(hash: string) {
  const transaction = await readClient.getTransaction({ hash });
  return receiptVerdict(transaction);
}

export function openCalldataBytes(
  otherWallet: string,
  otherLabel: string,
  text: string
): number {
  const wallet = isAddress(otherWallet)
    ? otherWallet
    : CONTRACT_ADDRESS;
  const call = abi.calldata.encode({
    method: "open_undertaking",
    args: [wallet, otherLabel, text]
  });
  const payload: any = abi.transactions.serialize([call, false]);
  if (typeof payload === "string" && payload.startsWith("0x")) {
    return Math.max(0, (payload.length - 2) / 2);
  }
  if (payload instanceof Uint8Array) return payload.byteLength;
  return new TextEncoder().encode(String(payload)).byteLength;
}
