// x402 Server - スターターテンプレート（基本）
// ボイラープレート部分は準備済み。TODO部分を実装してください。
import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { address } from "@solana/kit";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { x402HTTPResourceServer } from "@x402/core/http";
import type { HTTPAdapter } from "@x402/core/http";
import { ExactSvmScheme } from "@x402/svm/exact/server";

// ============================================================================
// 設定（環境変数から読み込み）
// ============================================================================
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = "$0.01";
const PORT = 3001;
const FACILITATOR_URL = "https://x402.org/facilitator";

// Express アプリ
const app = express();
app.use(express.json());

// Express用HTTPアダプター（x402パッケージがフレームワーク非依存のため必要）
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

// TODO 1: CAIP-2 ネットワーク識別子を定義


// TODO 2: setupX402Server関数を実装
// - HTTPFacilitatorClientを作成
// - x402ResourceServerを作成してExactSvmSchemeを登録
// - routesを定義（GET /premium の支払い要件）
// - x402HTTPResourceServerを作成して初期化


// TODO 3: main関数を実装
// - setupX402Serverを呼び出し
// - app.get("/premium", ...) エンドポイントを実装
//   - processHTTPRequestで支払いを処理
//   - payment-error → 402を返す
//   - payment-verified → processSettlementで決済 → コンテンツを返す
// - app.listenでサーバー起動

