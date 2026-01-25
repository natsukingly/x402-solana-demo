// x402 Client - スターターテンプレート（中級）
// 関数の枠組みまで準備済み
import "dotenv/config";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { readFileSync } from "fs";
import fetch from "node-fetch";

// ============================================================================
// 設定
// ============================================================================
const SERVER_URL = "http://localhost:3001";

async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

// ============================================================================
// TODO: ここからコーディング
// ============================================================================

async function payAndAccess() {
  // === クライアント初期化 ===
  const payer = await loadPayer();
  console.log(`Payer: ${payer.address}`);

  // TODO 1: x402クライアントを初期化
  // - toClientSvmSigner(payer)
  // - new x402Client()
  // - registerExactSvmScheme()
  // - new x402HTTPClient()

  // === 402を受け取る ===
  // TODO 2: fetch(SERVER_URL/premium) でリクエスト
  // TODO 3: 402なら client.getPaymentRequiredResponse() で要件抽出

  // === 支払い ===
  // TODO 4: client.createPaymentPayload() でペイロード作成
  // TODO 5: client.encodePaymentSignatureHeader() でヘッダーエンコード
  // TODO 6: ヘッダー付きで再リクエスト → 結果表示
}

payAndAccess().catch(console.error);
