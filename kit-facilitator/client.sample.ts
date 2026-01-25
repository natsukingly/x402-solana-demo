// x402 Client - 完成版サンプル (@solana/kit + Coinbase Facilitator版)
// x402 v2形式対応 - Coinbase Facilitatorを使用するサーバーに対応したクライアント
import "dotenv/config";
import {
  createSolanaRpc,
  createKeyPairSignerFromBytes,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  type Address,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  getTransferInstruction,
  fetchToken,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import fetch from "node-fetch";
import { readFileSync } from "fs";

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

// CAIP-2識別子からネットワーク名を取得
function getNetworkName(caip2: string): "mainnet" | "devnet" | "unknown" {
  if (caip2 === SOLANA_NETWORKS.mainnet) return "mainnet";
  if (caip2 === SOLANA_NETWORKS.devnet) return "devnet";
  return "unknown";
}

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

// 402レスポンス
interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirements[];
  error: string | null;
}

// x402 v2 ペイロード（Solana用）
interface PaymentPayloadV2 {
  x402Version: number;
  scheme: "exact";
  network: string;
  payload: {
    transaction: string;  // Base64エンコードされた署名済みトランザクション
    payer: string;        // 支払者の公開鍵
  };
}

// 成功レスポンス
interface PaymentResult {
  data?: string;
  paymentDetails?: {
    transaction: string;
    explorerUrl: string;
    payer?: string;
    amountUSDC?: number;
  };
  error?: string;
}

// 環境変数から設定を読み込み
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
// @solana/kit のRPCクライアントを作成
const rpc = createSolanaRpc(rpcUrl);
const PORT = process.env.PORT || 3001;

// クライアントのウォレット（秘密鍵）を読み込む関数
async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

// アセット文字列からmintアドレスを抽出
function extractMintFromAsset(asset: string): string {
  // 形式: "solana:{mintAddress}"
  const parts = asset.split(":");
  return parts.length > 1 ? parts[1] : asset;
}

async function payAndAccess() {
  // Keypair を非同期で読み込み
  const payer = await loadPayer();

  console.log(`=== x402 v${X402_VERSION} Client Demo (Facilitator) ===`);
  console.log(`Payer: ${payer.address}`);

  // 1. まず支払い要件を取得（402レスポンス）
  console.log("\n1. Requesting payment quote...");
  const quoteResponse = await fetch(`http://localhost:${PORT}/premium`);
  const quote = await quoteResponse.json() as PaymentRequiredResponse;

  if (quoteResponse.status !== 402) {
    console.log("Unexpected response:", quote);
    return;
  }

  // x402 v2形式の支払い要件を解析
  if (!quote.accepts || quote.accepts.length === 0) {
    console.error("No payment options available");
    return;
  }

  const accept = quote.accepts[0];
  const recipientTokenAccountStr = accept.payTo;
  const mintStr = extractMintFromAsset(accept.asset);
  const amount = BigInt(accept.maxAmountRequired);
  const networkName = getNetworkName(accept.network);

  console.log(`   x402 Version: ${quote.x402Version}`);
  console.log(`   Scheme: ${accept.scheme}`);
  console.log(`   Network: ${accept.network} (${networkName})`);
  console.log(`   Asset: ${accept.asset}`);
  console.log(`   Required: ${Number(amount) / 1_000_000} USDC`);
  console.log(`   Recipient: ${recipientTokenAccountStr}`);

  // エラーチェック
  if (quote.error) {
    console.error(`Server error: ${quote.error}`);
    return;
  }

  // 2. トランザクションを作成
  console.log("\n2. Creating payment transaction...");

  const recipientTokenAccount = address(recipientTokenAccountStr);
  const mint = address(mintStr);

  // 支払い元のToken Accountを取得
  const [payerAta] = await findAssociatedTokenPda({
    mint,
    owner: payer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  // Token Account の情報を取得して残高を確認
  const tokenAccountInfo = await fetchToken(rpc, payerAta);
  const balance = tokenAccountInfo.data.amount;

  console.log(`   Payer Token Account: ${payerAta}`);
  console.log(`   Balance: ${Number(balance) / 1_000_000} USDC`);

  // 残高チェック
  if (balance < amount) {
    console.error("Insufficient USDC balance!");
    console.log("Get devnet USDC from: https://faucet.circle.com/");
    return;
  }

  // 3. 送金トランザクションを作成
  const transferIx = getTransferInstruction({
    source: payerAta,
    destination: recipientTokenAccount,
    authority: payer,
    amount,
  });

  // 4. トランザクションを構築
  // @solana/kit のRPC APIを使用してブロックハッシュを取得
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // pipe パターンでトランザクションを構築
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayerSigner(payer, tx),
    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    tx => appendTransactionMessageInstruction(transferIx, tx),
  );

  // 5. 署名（送信はしない！サーバー→Facilitatorに送る）
  const signedTx = await signTransactionMessageWithSigners(transactionMessage);

  // 6. シリアライズしてBase64に変換
  const serializedTx = getBase64EncodedWireTransaction(signedTx);

  // 7. x402 v2形式のペイロードを作成（CAIP-2ネットワーク識別子を使用）
  const paymentPayload: PaymentPayloadV2 = {
    x402Version: X402_VERSION,
    scheme: "exact",
    network: accept.network,  // CAIP-2形式のネットワーク識別子をそのまま使用
    payload: {
      transaction: serializedTx,
      payer: payer.address,
    },
  };

  const xPaymentHeader = Buffer.from(
    JSON.stringify(paymentPayload)
  ).toString("base64");

  // 8. 支払いヘッダー付きでリクエスト
  console.log("\n3. Sending payment to server (via Facilitator)...");
  console.log(`   X-Payment header length: ${xPaymentHeader.length} chars`);

  const paidResponse = await fetch(`http://localhost:${PORT}/premium`, {
    headers: {
      "X-Payment": xPaymentHeader,
    },
  });

  const result = await paidResponse.json() as PaymentResult | PaymentRequiredResponse;

  if (paidResponse.status === 200) {
    const successResult = result as PaymentResult;
    console.log("\n=== Payment Successful! ===");
    console.log(`Content: ${successResult.data}`);
    if (successResult.paymentDetails) {
      console.log(`Transaction: ${successResult.paymentDetails.transaction}`);
      console.log(`Explorer: ${successResult.paymentDetails.explorerUrl}`);
      if (successResult.paymentDetails.payer) {
        console.log(`Payer: ${successResult.paymentDetails.payer}`);
      }
    }
  } else {
    const errorResult = result as PaymentRequiredResponse;
    console.log("\n=== Payment Failed ===");
    console.log(`x402 Version: ${errorResult.x402Version}`);
    console.log(`Error: ${errorResult.error}`);
  }
}

payAndAccess().catch(console.error);
