// x402 Server - スターターテンプレート（上級）
// ほぼ完成。穴埋め形式でx402の核心部分のみ実装
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

const SOLANA_NETWORKS = {
  mainnet: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;

const NETWORK = "devnet";
const NETWORK_CAIP2 = SOLANA_NETWORKS[NETWORK];

const app = express();
app.use(express.json());

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
// x402サーバーセットアップ
// ============================================================================

async function setupX402Server() {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register("solana:*", new ExactSvmScheme());

  // ★ TODO: ルート定義（支払い要件）
  const routes = {
    "GET /premium": {
      accepts: {
        scheme: "exact",
        network: NETWORK_CAIP2,
        payTo: undefined as any,   // ← TODO: 何を入れる？
        price: undefined as any,   // ← TODO: 何を入れる？
      },
    },
  };

  const httpServer = new x402HTTPResourceServer(resourceServer, routes);
  await httpServer.initialize();
  return httpServer;
}

// ============================================================================
// メイン
// ============================================================================

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

    const result = await httpServer.processHTTPRequest(context);

    // ★ TODO: resultの種類に応じて処理を分岐
    // payment-error → 402を返す
    // payment-verified → 決済してコンテンツを返す

    if (result.type === "payment-error") {
      for (const [key, value] of Object.entries(result.response.headers)) {
        res.setHeader(key, value);
      }
      return res.status(result.response.status).send(result.response.body);
    }

    if (result.type === "payment-verified") {
      // ★ TODO: processSettlementを呼んで決済
      // settlement.successならコンテンツを返す
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
