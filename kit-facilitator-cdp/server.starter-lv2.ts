// x402 Server - スターターテンプレート（中級）
// CAIP-2と関数の枠組みまで準備済み
import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { address } from "@solana/kit";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { x402HTTPResourceServer } from "@x402/core/http";
import type { HTTPAdapter } from "@x402/core/http";
import { ExactSvmScheme } from "@x402/svm/exact/server";

// ============================================================================
// 設定
// ============================================================================
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = "$0.01";
const PORT = 3001;
const FACILITATOR_URL = "https://x402.org/facilitator";

// CAIP-2 ネットワーク識別子
const SOLANA_NETWORKS = {
  mainnet: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;

const NETWORK = "devnet";
const NETWORK_CAIP2 = SOLANA_NETWORKS[NETWORK];

// Express
const app = express();
app.use(express.json());

// HTTPアダプター
function createExpressAdapter(req: Request): HTTPAdapter {
  return {
    getHeader: (name: string) => req.header(name),
    getMethod: () => req.method,
    getPath: () => req.path,
    getUrl: () => req.originalUrl,
    getAcceptHeader: () => req.header("accept") || "*/*",
    getUserAgent: () => req.header("user-agent") || "",
    getQueryParams: () => req.query as Record<string, string | string[]>,
    getQueryParam: (name) => req.query[name] as string | string[] | undefined,
    getBody: () => req.body,
  };
}

// ============================================================================
// TODO: ここから実装
// ============================================================================

async function setupX402Server() {
  // TODO 1: Facilitatorクライアントを作成

  // TODO 2: リソースサーバーを作成してスキームを登録

  // TODO 3: routesを定義（支払い要件）
  // - scheme: "exact"
  // - network: NETWORK_CAIP2
  // - payTo: RECIPIENT_WALLET
  // - price: PRICE_USDC

  // TODO 4: HTTPサーバーを作成して初期化
}

async function main() {
  const httpServer = await setupX402Server();

  app.get("/premium", async (req: Request, res: Response) => {
    const adapter = createExpressAdapter(req);
    const context = {
      adapter,
      path: req.path,
      method: req.method,
      paymentHeader: req.header("PAYMENT-SIGNATURE") || req.header("X-PAYMENT"),
    };

    // TODO 5: processHTTPRequestを呼び出し、結果に応じて処理
    // - payment-error → 402を返す
    // - payment-verified → processSettlementで決済 → コンテンツを返す
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
