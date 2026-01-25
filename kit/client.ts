// x402 Client - ハンズオン用テンプレート (@solana/kit版)
// 各 TODO セクションのコードを実装してください

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

// 型定義
interface PaymentQuote {
  payment: {
    amountUSDC: number;
    tokenAccount: string;
    mint: string;
    amount: number;
  };
}

interface PaymentResult {
  data?: string;
  paymentDetails?: {
    explorerUrl: string;
  };
  error?: string;
}

// =============================================================================
// TODO 1: 接続とウォレットを設定
// - rpcUrl: Solana DevnetのRPC URL
// - rpc: @solana/kit の createSolanaRpc() を使用
// - client.json から Keypair を読み込んで payer を作成
//   - createKeyPairSignerFromBytes() を使用（非同期関数）
// =============================================================================

const rpcUrl = "https://api.devnet.solana.com"; // TODO: 環境変数から読み込む
const rpc = createSolanaRpc(rpcUrl);

async function loadPayer() {
  // TODO: client.json から Keypair を読み込む
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

// =============================================================================

async function payAndAccess() {
  // Keypair を非同期で読み込み
  const payer = await loadPayer();

  console.log("=== x402 Client Demo ===");
  console.log(`Payer: ${payer.address}`);

  // ===========================================================================
  // TODO 2: サーバーから支払い情報を取得
  // 1. fetch() で http://localhost:3001/premium にリクエスト
  // 2. レスポンスを JSON としてパース
  // 3. status が 402 でなければ早期リターン
  // 4. 必要な情報をログ出力
  // ===========================================================================
  console.log("\n1. Requesting payment quote...");

  const response = await fetch("http://localhost:3001/premium");
  if (response.status !== 402) {
    console.log("Unexpected status:", response.status);
    return;
  }
  const quote = await response.json() as PaymentQuote;

  // ===========================================================================

  console.log(`   Required: ${quote.payment.amountUSDC} USDC`);
  console.log(`   Recipient: ${quote.payment.tokenAccount}`);

  // ===========================================================================
  // TODO 3: 支払い情報を変数に格納
  // - recipientTokenAccount: address() で quote.payment.tokenAccount を Address に変換
  // - mint: address() で quote.payment.mint を Address に変換
  // - amount: BigInt() で quote.payment.amount を bigint に変換
  // ===========================================================================
  console.log("\n2. Creating payment transaction...");



  // ===========================================================================

  // ===========================================================================
  // TODO 4: 支払い元のToken Accountを取得
  // - findAssociatedTokenPda() で Token Account アドレスを計算
  //   - 引数: { mint, owner: payer.address, tokenProgram: TOKEN_PROGRAM_ADDRESS }
  // - fetchToken() で Token Account の情報を取得
  // - 残高をログ出力
  // - 残高不足の場合は早期リターン
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 5: USDC送金命令を作成
  // - getTransferInstruction() を使用
  // - 引数: { source, destination, authority, amount }
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 6: トランザクションを構築して署名
  // 1. @solana/kit の rpc.getLatestBlockhash().send() でブロックハッシュを取得
  // 2. pipe() パターンでトランザクションを構築:
  //    - createTransactionMessage({ version: 0 })
  //    - setTransactionMessageFeePayerSigner(payer, tx)
  //    - setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
  //    - appendTransactionMessageInstruction(transferIx, tx)
  // 3. signTransactionMessageWithSigners() で署名（送信はしない！）
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 7: x402形式のペイロードを作成
  // 1. getBase64EncodedWireTransaction() でシリアライズ
  // 2. paymentProof オブジェクトを作成:
  //    - x402Version: 1
  //    - scheme: "exact"
  //    - network: "solana-devnet"
  //    - payload: { serializedTransaction: シリアライズしたTx }
  // 3. JSON.stringify して Base64 エンコード
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 8: X-Payment ヘッダー付きでサーバーにリクエスト
  // 1. fetch() で http://localhost:3001/premium にリクエスト
  //    - headers: { "X-Payment": xPaymentHeader }
  // 2. レスポンスを JSON としてパース
  // 3. status が 200 なら成功メッセージを表示
  // 4. それ以外は失敗メッセージを表示
  // ===========================================================================
  console.log("\n3. Sending payment...");



  // ===========================================================================
}

payAndAccess().catch(console.error);

