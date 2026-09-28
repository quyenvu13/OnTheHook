const WALLET_METHODS = new Set([
  "eth_accounts",
  "eth_requestAccounts",
  "eth_sendTransaction",
  "eth_signTransaction",
  "personal_sign",
  "eth_signTypedData_v4"
]);

const CHAIN_RPC_METHODS = new Set([
  "eth_getTransactionCount",
  "eth_estimateGas",
  "eth_gasPrice"
]);

export function createSplitProvider(walletProvider, chainRequest) {
  return {
    request(request) {
      if (WALLET_METHODS.has(request.method)) {
        return walletProvider.request(request);
      }
      if (CHAIN_RPC_METHODS.has(request.method)) {
        return chainRequest(request);
      }
      throw new Error("Unsupported write-client method: " + request.method);
    }
  };
}
