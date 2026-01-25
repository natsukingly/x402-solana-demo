// x402 Client - ハンズオン用テンプレート (@solana/kit + Coinbase Facilitator版)
// x402 v2形式対応 - 各 TODO セクションのコードを実装してください

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

// =============================================================================
// TODO 1: 接続とウォレットを設定
// - rpcUrl: Solana DevnetのRPC URL
// - rpc: @solana/kit の createSolanaRpc() を使用
// - loadPayer(): createKeyPairSignerFromBytes() で client.json から Keypair を読み込む関数
// =============================================================================

const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const rpc = createSolanaRpc(rpcUrl);

async function loadPayer() {
  // TODO: 環境変数または client.json から Keypair を読み込む
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

// =============================================================================

// アセット文字列からmintアドレスを抽出
function extractMintFromAsset(asset: string): string {
  const parts = asset.split(":");
  return parts.length > 1 ? parts[1] : asset;
}

async function payAndAccess() {
  // Keypair を非同期で読み込み
  const payer = await loadPayer();

  console.log(`=== x402 v${X402_VERSION} Client Demo (Facilitator) ===`);
  console.log(`Payer: ${payer.address}`);

  // ===========================================================================
  // TODO 2: サーバーから支払い情報を取得
  // 1. fetch() で http://localhost:3001/premium にリクエスト
  // 2. レスポンスを PaymentRequiredResponse としてパース
  // 3. status が 402 でなければ早期リターン
  // 4. accepts[0] から支払い情報を抽出
  // 5. getNetworkName() でCAIP-2識別子からネットワーク名を取得
  // ===========================================================================
  console.log("\n1. Requesting payment quote...");

  const response = await fetch("http://localhost:3001/premium");
  if (response.status !== 402) {
    console.log("Unexpected status:", response.status);
    return;
  }
  const quote = await response.json() as PaymentRequiredResponse;
  const accept = quote.accepts[0];
  const networkName = getNetworkName(accept.network);
  console.log(`   Network: ${accept.network} (${networkName})`);

  const amount = BigInt(accept.maxAmountRequired);
  const recipientTokenAccountStr = accept.payTo;

  // ===========================================================================

  console.log(`   Required: ${Number(amount) / 1_000_000} USDC`);
  console.log(`   Recipient: ${recipientTokenAccountStr}`);

  // ===========================================================================
  // TODO 3: 支払い情報を変数に格納してToken Accountを取得
  // - recipientTokenAccount: address() で recipientTokenAccountStr を Address に変換
  // - mint: address() で extractMintFromAsset() の結果を Address に変換
  // - findAssociatedTokenPda() で支払い元Token Accountアドレスを取得
  // - fetchToken() で Token Account の情報を取得して残高チェック
  // ===========================================================================
  console.log("\n2. Creating payment transaction...");



  // ===========================================================================

  // ===========================================================================
  // TODO 4: USDC送金命令を作成
  // - getTransferInstruction() を使用
  // - 引数: { source, destination, authority, amount }
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 5: トランザクションを構築して署名
  // 1. @solana/kit の rpc.getLatestBlockhash().send() でブロックハッシュを取得
  // 2. pipe() パターンでトランザクションを構築:
  //    - createTransactionMessage({ version: 0 })
  //    - setTransactionMessageFeePayerSigner(payer, tx)
  //    - setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
  //    - appendTransactionMessageInstruction(transferIx, tx)
  // 3. signTransactionMessageWithSigners() で署名
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 6: x402 v2形式のペイロードを作成
  // 1. getBase64EncodedWireTransaction() でシリアライズ
  // 2. PaymentPayloadV2 オブジェクトを作成:
  //    - x402Version: 2
  //    - scheme: "exact"
  //    - network: accept.network (CAIP-2形式をそのまま使用)
  //    - payload: { transaction: シリアライズしたTx, payer: payer.address }
  // 3. JSON.stringify して Base64 エンコード
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 7: X-Payment ヘッダー付きでサーバーにリクエスト
  // 1. fetch() で http://localhost:3001/premium にリクエスト
  //    - headers: { "X-Payment": xPaymentHeader }
  // 2. レスポンスを JSON としてパース
  // 3. status が 200 なら成功メッセージを表示
  // 4. それ以外は x402 v2形式のエラーメッセージを表示
  // ===========================================================================
  console.log("\n3. Sending payment to server (via Facilitator)...");



  // ===========================================================================
}

payAndAccess().catch(console.error);
