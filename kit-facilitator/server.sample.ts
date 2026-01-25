// x402 Server - 完成版サンプル (@solana/kit + Coinbase Facilitator版)
// x402 v2形式対応 - Coinbase Facilitatorを使用してトランザクションの検証・送信を行う
import "dotenv/config";
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

// 環境変数から設定を読み込み
const USDC_MINT = address(process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = Number(process.env.PRICE_USDC) || 100; // 0.0001 USDC (6 decimals)
const PORT = Number(process.env.PORT) || 3001;

// ネットワーク設定 (devnet or mainnet)
const NETWORK = (process.env.SOLANA_NETWORK as keyof typeof SOLANA_NETWORKS) || "devnet";
const NETWORK_CAIP2 = SOLANA_NETWORKS[NETWORK];

// Coinbase Facilitator設定
// テスト用: https://x402.org/facilitator (APIキー不要)
// 本番用: https://api.cdp.coinbase.com/platform/v2/x402 (CDP APIキー必要)
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

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

// Facilitator検証リクエスト
interface FacilitatorVerifyRequest {
  x402Version: number;
  paymentPayload: string;
  paymentRequirements: PaymentRequirements;
}

// Facilitator検証レスポンス
interface FacilitatorVerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

// Facilitator決済リクエスト
interface FacilitatorSettleRequest {
  x402Version: number;
  paymentPayload: string;
  paymentRequirements: PaymentRequirements;
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

// x402 v2の支払い要件を生成する関数
async function getPaymentRequirements(): Promise<PaymentRequirements> {
  const [recipientTokenAccount] = await findAssociatedTokenPda({
    mint: USDC_MINT,
    owner: RECIPIENT_WALLET,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  return {
    scheme: "exact",
    network: NETWORK_CAIP2,  // CAIP-2形式のネットワーク識別子
    maxAmountRequired: PRICE_USDC.toString(),
    asset: `solana:${USDC_MINT}`,
    payTo: recipientTokenAccount,
    resource: "/premium",
    description: "Premium content access",
    maxTimeoutSeconds: 60,
    mimeType: "application/json",
    outputSchema: null,
    extra: {
      name: "x402 Demo Premium Content",
      version: "2.0.0",
    },
  };
}

// Facilitatorで支払いを検証
async function verifyPayment(
  paymentPayload: string,
  paymentRequirements: PaymentRequirements
): Promise<FacilitatorVerifyResponse> {
  const request: FacilitatorVerifyRequest = {
    x402Version: X402_VERSION,
    paymentPayload,
    paymentRequirements,
  };

  const response = await fetch(`${FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facilitator verify failed: ${response.status} - ${errorText}`);
  }

  return await response.json() as FacilitatorVerifyResponse;
}

// Facilitatorでトランザクションを決済（送信）
async function settlePayment(
  paymentPayload: string,
  paymentRequirements: PaymentRequirements
): Promise<FacilitatorSettleResponse> {
  const request: FacilitatorSettleRequest = {
    x402Version: X402_VERSION,
    paymentPayload,
    paymentRequirements,
  };

  const response = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facilitator settle failed: ${response.status} - ${errorText}`);
  }

  return await response.json() as FacilitatorSettleResponse;
}

// Solana Explorer URL生成
function getExplorerUrl(signature: string): string {
  const cluster = NETWORK === "mainnet" ? "" : "?cluster=devnet";
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

app.get("/premium", async (req, res) => {
  const xPaymentHeader = req.header("X-Payment");
  const paymentRequirements = await getPaymentRequirements();

  if (xPaymentHeader) {
    try {
      // 1. Facilitatorで支払いを検証
      console.log("Verifying payment with facilitator...");
      const verifyResult = await verifyPayment(xPaymentHeader, paymentRequirements);

      if (!verifyResult.isValid) {
        const errorResponse: PaymentRequiredResponse = {
          x402Version: X402_VERSION,
          accepts: [paymentRequirements],
          error: verifyResult.invalidReason || "Payment verification failed",
        };
        return res.status(402).json(errorResponse);
      }

      console.log(`Payment verified. Payer: ${verifyResult.payer}`);

      // 2. Facilitatorでトランザクションを決済（送信）
      console.log("Settling payment with facilitator...");
      const settleResult = await settlePayment(xPaymentHeader, paymentRequirements);

      if (!settleResult.success) {
        const errorResponse: PaymentRequiredResponse = {
          x402Version: X402_VERSION,
          accepts: [paymentRequirements],
          error: settleResult.errorMessage || "Payment settlement failed",
        };
        return res.status(402).json(errorResponse);
      }

      console.log(`Payment settled. Transaction: ${settleResult.transaction}`);

      // 成功レスポンス
      return res.json({
        data: "これはプレミアムコンテンツです！支払いありがとうございます。",
        paymentDetails: {
          transaction: settleResult.transaction,
          network: settleResult.network,
          payer: settleResult.payer,
          amount: PRICE_USDC,
          amountUSDC: PRICE_USDC / 1_000_000,
          explorerUrl: getExplorerUrl(settleResult.transaction || ""),
        },
      });
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

  // 支払いがない場合は402レスポンスで支払い情報を返す（x402 v2形式）
  const response: PaymentRequiredResponse = {
    x402Version: X402_VERSION,
    accepts: [paymentRequirements],
    error: null,
  };

  return res.status(402).json(response);
});

app.listen(PORT, () => {
  console.log(`x402 v${X402_VERSION} Server (Facilitator) running on http://localhost:${PORT}`);
  console.log(`Network: ${NETWORK} (${NETWORK_CAIP2})`);
  console.log(`Facilitator URL: ${FACILITATOR_URL}`);
  console.log(`Recipient: ${RECIPIENT_WALLET}`);
});
