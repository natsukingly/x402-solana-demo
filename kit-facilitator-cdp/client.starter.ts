// x402 Client - スターターテンプレート（基本）
// ボイラープレート部分は準備済み。TODO部分を実装してください。
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

// ウォレット読み込み
async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

// ============================================================================
// TODO: ここからコーディング
// ============================================================================

// TODO: payAndAccess関数を実装
// 1. payerを読み込み、x402クライアントを初期化
//    - toClientSvmSigner(payer) でシグナー作成
//    - new x402Client() でコアクライアント作成
//    - registerExactSvmScheme() でスキーム登録
//    - new x402HTTPClient() でHTTPクライアント作成
//
// 2. fetch(SERVER_URL/premium) で最初のリクエスト
//    - 402が返ってくることを確認
//
// 3. client.getPaymentRequiredResponse() で支払い要件を抽出
//
// 4. client.createPaymentPayload() で支払いペイロード作成
//
// 5. client.encodePaymentSignatureHeader() でヘッダーエンコード
//
// 6. 支払いヘッダー付きで再度fetch
//    - 200ならclient.getPaymentSettleResponse()で決済情報取得
//    - コンテンツを表示

