export const CONTRACT_ADDRESS = (
  import.meta.env.VITE_CONTRACT_ADDRESS
  || "0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166"
) as any;

export const DEPLOY_TX = (
  import.meta.env.VITE_DEPLOY_TX
  || "0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e"
) as any;

export const SOURCE_SHA256 =
  "41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d";
export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_HEX = "0xf22f";
export const RPC_PATH = "/genlayer-rpc";
export const STUDIO_WALLET_RPC = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";
export const CONTRACT_EXPLORER_URL =
  EXPLORER_BASE + "/address/" + CONTRACT_ADDRESS;
export const DEPLOY_EXPLORER_URL = EXPLORER_BASE + "/tx/" + DEPLOY_TX;
export const MAX_TEXT_LENGTH = 600;
export const MAX_LABEL_LENGTH = 80;
export const MAX_NOTE_LENGTH = 300;
export const MAX_LOG_ENTRIES = 30;
export const SAFE_CALLDATA_BYTES = 255;
