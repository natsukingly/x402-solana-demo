// x402 Client - 完成版サンプル (@x402/svm + @x402/core 公式パッケージ使用)
// x402 v2形式対応 - Coinbase公式パッケージを使用した正しい実装
import "dotenv/config";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { toClientSvmSigner, ExactSvmScheme } from "@x402/svm";
import { ExactSvmScheme as ExactSvmClientScheme, registerExactSvmScheme } from "@x402/svm/exact/client";
import { readFileSync } from "fs";
import fetch from "node-fetch";

// 環境変数から設定を読み込み
const PORT = process.env.PORT || 3001;
const SERVER_URL = `http://localhost:${PORT}`;

// クライアントのウォレット（秘密鍵）を読み込む関数
async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

async function payAndAccess() {
  // @solana/kit形式のキーペアシグナーを作成
  const payer = await loadPayer();

  console.log("=== x402 v2 Client Demo (@x402/svm) ===");
  console.log(`Payer: ${payer.address}`);

  // x402 SVM シグナーを作成
  const signer = toClientSvmSigner(payer);

  // x402クライアントを作成してSVMスキームを登録
  const coreClient = new x402Client();
  registerExactSvmScheme(coreClient, { signer });

  // HTTPクライアントでラップ
  const client = new x402HTTPClient(coreClient);

  // 1. まずリソースにアクセス（402レスポンスを取得）
  console.log("\n1. Requesting resource...");
  const response = await fetch(`${SERVER_URL}/premium`);

  console.log(`   Status: ${response.status}`);

  if (response.status !== 402) {
    if (response.status === 200) {
      const data = await response.json();
      console.log("   Resource already accessible (no payment needed)");
      console.log("   Content:", data);
      return;
    }
    console.log("   Unexpected status:", response.status);
    const text = await response.text();
    console.log("   Response:", text);
    return;
  }

  // 2. 支払い要件を抽出
  console.log("\n2. Extracting payment requirements...");
  const body = await response.json();

  const paymentRequired = client.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );

  if (!paymentRequired) {
    console.error("   Failed to extract payment requirements");
    return;
  }

  console.log(`   x402 Version: ${paymentRequired.x402Version}`);
  console.log(`   Accepts: ${paymentRequired.accepts.length} option(s)`);

  if (paymentRequired.accepts.length > 0) {
    const accept = paymentRequired.accepts[0];
    console.log(`   Scheme: ${accept.scheme}`);
    console.log(`   Network: ${accept.network}`);
    console.log(`   Amount: ${accept.amount}`);
    console.log(`   PayTo: ${accept.payTo}`);
  }

  // 3. 支払いペイロードを作成
  console.log("\n3. Creating payment payload...");

  try {
    const paymentPayload = await client.createPaymentPayload(paymentRequired);

    if (!paymentPayload) {
      console.error("   Failed to create payment payload");
      return;
    }

    console.log("   Payment payload created successfully");

    // 4. 支払いヘッダーをエンコード
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);
    console.log("   Payment header encoded");

    // 5. 支払いヘッダー付きでリクエスト
    console.log("\n4. Sending payment...");

    const paidResponse = await fetch(`${SERVER_URL}/premium`, {
      headers: paymentHeaders as Record<string, string>,
    });

    console.log(`   Status: ${paidResponse.status}`);

    if (paidResponse.status === 200) {
      // 決済レスポンスを取得
      const settlement = client.getPaymentSettleResponse(
        (name) => paidResponse.headers.get(name)
      );

      const data = await paidResponse.json() as { data?: unknown };

      console.log("\n=== Payment Successful! ===");
      console.log(`Content: ${JSON.stringify(data.data || data, null, 2)}`);

      if (settlement) {
        console.log(`Transaction: ${settlement.transaction}`);
        console.log(`Network: ${settlement.network}`);
      }
    } else {
      const errorBody = await paidResponse.json();
      console.log("\n=== Payment Failed ===");
      console.log(`Error: ${JSON.stringify(errorBody, null, 2)}`);
    }
  } catch (error) {
    console.error("\n=== Error ===");
    console.error(error instanceof Error ? error.message : error);
  }
}

payAndAccess().catch(console.error);
