// x402 Server Template (@x402/svm + @x402/core 公式パッケージ使用)
// このファイルをコピーして使用してください
import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { address, type Address } from "@solana/kit";
// Note: @x402/svm computes ATAs internally, so we don't need findAssociatedTokenPda here
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { x402HTTPResourceServer } from "@x402/core/http";
import type { HTTPAdapter } from "@x402/core/http";
import { ExactSvmScheme } from "@x402/svm/exact/server";

// ============================================================================
// TODO: 環境変数を設定してください
// ============================================================================
// Note: USDC_MINT は指定不要 - @x402/svm がネットワークに応じて自動選択
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = process.env.PRICE_USDC || "$0.01";
const PORT = Number(process.env.PORT) || 3000;

// CAIP-2 ネットワーク識別子
const SOLANA_NETWORKS = {
  mainnet: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;

const NETWORK = (process.env.SOLANA_NETWORK as keyof typeof SOLANA_NETWORKS) || "devnet";
const NETWORK_CAIP2 = SOLANA_NETWORKS[NETWORK];
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

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
    getQueryParam: (name: string) => req.query[name] as string | string[] | undefined,
    getBody: () => req.body,
  };
}

async function setupX402Server() {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register("solana:*", new ExactSvmScheme());

  // Note: @x402/svm expects payTo to be a WALLET address, not an ATA.
  // The library will compute the ATA internally using findAssociatedTokenPda.

  // TODO: ルートを設定してください
  const routes = {
    "GET /premium": {
      accepts: {
        scheme: "exact",
        network: NETWORK_CAIP2,
        payTo: RECIPIENT_WALLET as string,  // Use wallet address, not ATA
        price: PRICE_USDC,
      },
      description: "Premium content access",
      mimeType: "application/json",
    },
  };

  const httpServer = new x402HTTPResourceServer(resourceServer, routes);
  await httpServer.initialize();

  return httpServer;
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

    try {
      const result = await httpServer.processHTTPRequest(context);

      if (result.type === "no-payment-required") {
        return res.json({ data: "Free content" });
      }

      if (result.type === "payment-error") {
        for (const [key, value] of Object.entries(result.response.headers)) {
          res.setHeader(key, value);
        }
        return res.status(result.response.status).send(result.response.body);
      }

      if (result.type === "payment-verified") {
        const settlement = await httpServer.processSettlement(
          result.paymentPayload,
          result.paymentRequirements
        );

        if (settlement.success) {
          for (const [key, value] of Object.entries(settlement.headers)) {
            res.setHeader(key, value);
          }
          // TODO: プレミアムコンテンツを返す
          return res.json({
            data: "Premium content",
            transaction: settlement.transaction,
            network: settlement.network,
          });
        } else {
          return res.status(402).json({
            error: "Settlement failed",
            reason: settlement.errorReason,
          });
        }
      }
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);

