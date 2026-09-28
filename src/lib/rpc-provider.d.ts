type RpcRequest = { method: string; params?: unknown[] };

export function createSplitProvider(
  walletProvider: { request: (request: RpcRequest) => Promise<unknown> },
  chainRequest: (request: RpcRequest) => Promise<unknown>
): { request: (request: RpcRequest) => Promise<unknown> };
