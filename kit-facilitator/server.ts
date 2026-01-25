// x402 Server - ハンズオン用テンプレート (@solana/kit + Coinbase Facilitator版)
// x402 v2形式対応 - 各 TODO セクションのコードを実装してください

import express from "express";
import { address, type Address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import fetch from "node-fetch";

// x402 v2 バージョン定数
const X402_VERSION = 2;

// ============================================================================
// CAIP-2 ネットワーク識別子 (Chain Agnostic Improvement Proposal)
// https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
// ============================================================================
// Solana networks: solana:{genesisHash} (truncated genesis hash)
const SOLANA_NETWORKS = {
  mainnet: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;

// =============================================================================
// TODO 1: 定数と設定を設定してください
// - USDC_MINT: address() で Devnet USDCのMintアドレスを指定
//   (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU)
// - RECIPIENT_WALLET: address() で自分のサーバーウォレットの公開鍵を指定
// - PRICE_USDC: 価格 (USDCは6桁の小数点、100 = 0.0001 USDC)
// - NETWORK: "devnet" または "mainnet"
// - NETWORK_CAIP2: SOLANA_NETWORKS[NETWORK] でCAIP-2識別子を取得
// - FACILITATOR_URL: Coinbase FacilitatorのURL
//   - テスト用: https://x402.org/facilitator
//   - 本番用: https://api.cdp.coinbase.com/platform/v2/x402
// =============================================================================

const USDC_MINT = address(process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = Number(process.env.PRICE_USDC) || 100;
const PORT = Number(process.env.PORT) || 3001;
const NETWORK = (process.env.SOLANA_NETWORK as keyof typeof SOLANA_NETWORKS) || "devnet";
const NETWORK_CAIP2 = SOLANA_NETWORKS[NETWORK];
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

// =============================================================================

// ============================================================================
// x402 v2 型定義
// ============================================================================

// 支払い要件 (PaymentRequirements)
interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
  maxTimeoutSeconds: number;
  mimeType: string;
  outputSchema: null;
  extra: {
    name: string;
    version: string;
  };
}

// Facilitator検証レスポンス
interface FacilitatorVerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

// Facilitator決済レスポンス
interface FacilitatorSettleResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  errorMessage?: string;
  payer?: string;
}

// 402レスポンス
interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirements[];
  error: string | null;
}

const app = express();
app.use(express.json());

// =============================================================================
// TODO 2: x402 v2形式の支払い要件を生成する関数を実装
// - findAssociatedTokenPda() で受取先Token Accountを計算
//   - 引数: { mint: USDC_MINT, owner: RECIPIENT_WALLET, tokenProgram: TOKEN_PROGRAM_ADDRESS }
// - NETWORK_CAIP2 をnetworkフィールドに設定
// - PaymentRequirements オブジェクトを返す（v2形式）
// =============================================================================
async function getPaymentRequirements(): Promise<PaymentRequirements> {
  const [recipientTokenAccount] = await findAssociatedTokenPda({
    mint: USDC_MINT,
    owner: RECIPIENT_WALLET,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  return {
    scheme: "exact",
    network: NETWORK_CAIP2,
    maxAmountRequired: String(PRICE_USDC),
    asset: `solana:${USDC_MINT}`,
    payTo: recipientTokenAccount as string,
    resource: "http://localhost:3001/premium",
    description: "Premium content access",
    maxTimeoutSeconds: 60,
    mimeType: "application/json",
    outputSchema: null,
    extra: {
      name: "x402-demo-server",
      version: "1.0.0",
    },
  };
}
// =============================================================================

// =============================================================================
// TODO 3: Facilitatorで支払いを検証する関数を実装
// - FACILITATOR_URL/verify にPOSTリクエスト
// - x402Version: 2, paymentPayload, paymentRequirements を送信
// - レスポンスを FacilitatorVerifyResponse として返す
// =============================================================================
async function verifyPayment(
  paymentPayload: string,
  paymentRequirements: PaymentRequirements
): Promise<FacilitatorVerifyResponse> {
  const response = await fetch(`${FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: X402_VERSION,
      paymentPayload,
      paymentRequirements,
    }),
  });
  return await response.json() as FacilitatorVerifyResponse;
}
// =============================================================================

// =============================================================================
// TODO 4: Facilitatorでトランザクションを決済する関数を実装
// - FACILITATOR_URL/settle にPOSTリクエスト
// - x402Version: 2, paymentPayload, paymentRequirements を送信
// - レスポンスを FacilitatorSettleResponse として返す
// =============================================================================
async function settlePayment(
  paymentPayload: string,
  paymentRequirements: PaymentRequirements
): Promise<FacilitatorSettleResponse> {
  const response = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: X402_VERSION,
      paymentPayload,
      paymentRequirements,
    }),
  });
  return await response.json() as FacilitatorSettleResponse;
}
// =============================================================================

app.get("/premium", async (req, res) => {
  const xPaymentHeader = req.header("X-Payment");
  const paymentRequirements = await getPaymentRequirements();

  if (xPaymentHeader) {
    try {
      // =======================================================================
      // TODO 5: Facilitatorで支払いを検証・決済
      // 1. verifyPayment() で支払いを検証
      // 2. 検証失敗時は x402 v2形式の 402 エラーを返す
      // 3. settlePayment() でトランザクションを決済
      // 4. 決済失敗時は x402 v2形式の 402 エラーを返す
      // 5. 成功レスポンスを返す
      // =======================================================================

      // 検証
      const verifyResult = await verifyPayment(xPaymentHeader, paymentRequirements);
      if (!verifyResult.isValid) {
        const errorResponse: PaymentRequiredResponse = {
          x402Version: X402_VERSION,
          accepts: [paymentRequirements],
          error: verifyResult.invalidReason || "Payment verification failed",
        };
        return res.status(402).json(errorResponse);
      }

      // 決済
      const settleResult = await settlePayment(xPaymentHeader, paymentRequirements);
      if (!settleResult.success) {
        const errorResponse: PaymentRequiredResponse = {
          x402Version: X402_VERSION,
          accepts: [paymentRequirements],
          error: settleResult.errorMessage || "Payment settlement failed",
        };
        return res.status(402).json(errorResponse);
      }

      // 成功
      return res.json({
        data: "これはプレミアムコンテンツです！支払いありがとうございます。",
        paymentDetails: {
          transaction: settleResult.transaction,
          network: settleResult.network,
          payer: settleResult.payer,
        },
      });

      // =======================================================================

    } catch (e) {
      console.error("Payment processing error:", e);
      const errorResponse: PaymentRequiredResponse = {
        x402Version: X402_VERSION,
        accepts: [paymentRequirements],
        error: e instanceof Error ? e.message : "Unknown error",
      };
      return res.status(402).json(errorResponse);
    }
  }

  // ===========================================================================
  // TODO 6: 支払いがない場合、x402 v2形式の402レスポンスで支払い情報を返す
  // - x402Version: 2
  // - accepts: [paymentRequirements]
  // - error: null
  // ===========================================================================

  const response402: PaymentRequiredResponse = {
    x402Version: X402_VERSION,
    accepts: [paymentRequirements],
    error: null,
  };
  return res.status(402).json(response402);

  // ===========================================================================
});

// =============================================================================
// TODO 7: サーバーをポート3001で起動
// - NETWORK_CAIP2 をログ出力すると便利
// =============================================================================

app.listen(PORT, () => {
  console.log(`x402 v${X402_VERSION} Server running on http://localhost:${PORT}`);
  console.log(`Network: ${NETWORK} (${NETWORK_CAIP2})`);
  console.log(`Facilitator: ${FACILITATOR_URL}`);
});
