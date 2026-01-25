// x402 Server - 完成版サンプル (@x402/svm + @x402/core 公式パッケージ使用)
// x402 v2形式対応 - Coinbase公式パッケージを使用した正しい実装
import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { address, type Address } from "@solana/kit";
// Note: @x402/svm expects payTo to be a WALLET address, not an ATA.
// The library computes the ATA internally using findAssociatedTokenPda.
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { x402HTTPResourceServer } from "@x402/core/http";
import type { HTTPAdapter } from "@x402/core/http";
import { ExactSvmScheme } from "@x402/svm/exact/server";

// ============================================================================
// CAIP-2 ネットワーク識別子
// ============================================================================
const SOLANA_NETWORKS = {
  mainnet: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;

// 環境変数から設定を読み込み
// Note: USDC_MINT は指定不要 - @x402/svm がネットワークに応じて自動選択
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = process.env.PRICE_USDC || "$0.0001"; // ドル形式
const PORT = Number(process.env.PORT) || 3001;

// ネットワーク設定
const NETWORK = (process.env.SOLANA_NETWORK as keyof typeof SOLANA_NETWORKS) || "devnet";
const NETWORK_CAIP2 = SOLANA_NETWORKS[NETWORK];

// Facilitator設定
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

const app = express();
app.use(express.json());

// Express用のHTTPアダプター
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

// x402サーバーセットアップ
async function setupX402Server() {
  // Facilitatorクライアントを作成
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  // リソースサーバーを作成してSVMスキームを登録
  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register("solana:*", new ExactSvmScheme());

  // ルート設定（支払い要件を定義）
  // 重要: payTo にはウォレットアドレスを指定（ATAではない）
  // @x402/svm ライブラリが内部でATAを計算します
  const routes = {
    "GET /premium": {
      accepts: {
        scheme: "exact",
        network: NETWORK_CAIP2,
        payTo: RECIPIENT_WALLET as string,  // ウォレットアドレスを指定
        price: PRICE_USDC,
      },
      description: "Premium content access",
      mimeType: "application/json",
    },
  };

  // HTTPサーバーラッパーを作成
  const httpServer = new x402HTTPResourceServer(resourceServer, routes);

  // 初期化（Facilitatorから対応するスキームを取得）
  await httpServer.initialize();

  return httpServer;
}

// メインのセットアップと起動
async function main() {
  const httpServer = await setupX402Server();

  // /premium エンドポイント
  app.get("/premium", async (req: Request, res: Response) => {
    const adapter = createExpressAdapter(req);
    const context = {
      adapter,
      path: req.path,
      method: req.method,
      paymentHeader: req.header("PAYMENT-SIGNATURE") || req.header("X-PAYMENT"),
    };

    try {
      // x402支払いを処理
      const result = await httpServer.processHTTPRequest(context);

      if (result.type === "no-payment-required") {
        // ルートが見つからない場合（このケースは通常発生しない）
        return res.json({ data: "Free content" });
      }

      if (result.type === "payment-error") {
        // 402 Payment Required または検証エラー
        for (const [key, value] of Object.entries(result.response.headers)) {
          res.setHeader(key, value);
        }
        return res.status(result.response.status).send(result.response.body);
      }

      if (result.type === "payment-verified") {
        // 支払い検証成功 - 決済を処理
        const settlement = await httpServer.processSettlement(
          result.paymentPayload,
          result.paymentRequirements
        );

        if (settlement.success) {
          // 決済成功 - ヘッダーを設定してコンテンツを返す
          for (const [key, value] of Object.entries(settlement.headers)) {
            res.setHeader(key, value);
          }
          return res.json({
            data: "これはプレミアムコンテンツです！支払いありがとうございます。",
            transaction: settlement.transaction,
            network: settlement.network,
          });
        } else {
          // 決済失敗
          return res.status(402).json({
            error: "Settlement failed",
            reason: settlement.errorReason,
          });
        }
      }
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`x402 v2 Server (@x402/svm) running on http://localhost:${PORT}`);
    console.log(`Network: ${NETWORK} (${NETWORK_CAIP2})`);
    console.log(`Facilitator URL: ${FACILITATOR_URL}`);
    console.log(`Recipient: ${RECIPIENT_WALLET}`);
    console.log(`Price: ${PRICE_USDC}`);
  });
}

main().catch(console.error);
