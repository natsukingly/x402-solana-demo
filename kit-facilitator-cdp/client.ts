// x402 Client Template (@x402/svm + @x402/core 公式パッケージ使用)
// このファイルをコピーして使用してください
import "dotenv/config";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { readFileSync } from "fs";
import fetch from "node-fetch";

// TODO: 環境変数を設定してください
const PORT = process.env.PORT || 3001;
const SERVER_URL = `http://localhost:${PORT}`;

// クライアントのウォレット（秘密鍵）を読み込む関数
async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

async function payAndAccess() {
  const payer = await loadPayer();
  console.log(`Payer: ${payer.address}`);

  const signer = toClientSvmSigner(payer);
  const coreClient = new x402Client();
  registerExactSvmScheme(coreClient, { signer });
  const client = new x402HTTPClient(coreClient);

  // 1. リソースにアクセス
  const response = await fetch(`${SERVER_URL}/premium`);

  if (response.status !== 402) {
    if (response.status === 200) {
      console.log("Resource accessible:", await response.json());
      return;
    }
    console.log("Unexpected status:", response.status);
    return;
  }

  // 2. 支払い要件を抽出
  const body = await response.json();
  const paymentRequired = client.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );

  if (!paymentRequired) {
    console.error("Failed to extract payment requirements");
    return;
  }

  console.log(`Accepts: ${paymentRequired.accepts.length} option(s)`);

  // 3. 支払いペイロードを作成
  try {
    const paymentPayload = await client.createPaymentPayload(paymentRequired);

    if (!paymentPayload) {
      console.error("Failed to create payment payload");
      return;
    }

    // 4. 支払いヘッダーをエンコードして送信
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);

    const paidResponse = await fetch(`${SERVER_URL}/premium`, {
      headers: paymentHeaders as Record<string, string>,
    });

    if (paidResponse.status === 200) {
      const settlement = client.getPaymentSettleResponse(
        (name) => paidResponse.headers.get(name)
      );
      const data = await paidResponse.json();

      console.log("Payment successful!");
      console.log("Content:", data);
      if (settlement) {
        console.log("Transaction:", settlement.transaction);
      }
    } else {
      console.log("Payment failed:", await paidResponse.json());
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

payAndAccess().catch(console.error);

