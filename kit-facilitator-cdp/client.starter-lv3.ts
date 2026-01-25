// x402 Client - スターターテンプレート（上級）
// ほぼ完成。穴埋め形式でx402の核心部分のみ実装
import "dotenv/config";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { readFileSync } from "fs";
import fetch from "node-fetch";

const SERVER_URL = "http://localhost:3001";

async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

// ============================================================================
// 支払いフロー
// ============================================================================

async function payAndAccess() {
  const payer = await loadPayer();
  console.log(`Payer: ${payer.address}`);

  // クライアント初期化
  const signer = toClientSvmSigner(payer);
  const coreClient = new x402Client();
  registerExactSvmScheme(coreClient, { signer });
  const client = new x402HTTPClient(coreClient);

  // 1. リソースにアクセス（402が返る）
  const response = await fetch(`${SERVER_URL}/premium`);
  console.log(`Status: ${response.status}`);

  if (response.status !== 402) {
    console.log("予期しないステータス");
    return;
  }

  // 2. 支払い要件を抽出
  const body = await response.json();
  const paymentRequired = client.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );

  console.log(`Amount: ${paymentRequired?.accepts[0].amount}`);

  // ★ TODO: 支払いペイロードを作成
  // const paymentPayload = ???

  // ★ TODO: 支払いヘッダーをエンコード
  // const paymentHeaders = ???

  // ★ TODO: 支払いヘッダー付きでリクエスト
  // const paidResponse = await fetch(???)

  // ★ TODO: 200なら成功、結果を表示
}

payAndAccess().catch(console.error);
