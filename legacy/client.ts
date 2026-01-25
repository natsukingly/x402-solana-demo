// x402 Client - ハンズオン用テンプレート (@solana/web3.js版)
// 各 TODO セクションのコードを実装してください

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
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
// - connection: Solana Devnetへの接続
// - client.json から Keypair を読み込んで payer を作成
// =============================================================================



// =============================================================================

async function payAndAccess() {
  console.log("=== x402 Client Demo ===");
  console.log(`Payer: ${payer.publicKey.toBase58()}`);

  // ===========================================================================
  // TODO 2: サーバーから支払い情報を取得
  // 1. fetch() で http://localhost:3001/premium にリクエスト
  // 2. レスポンスを JSON としてパース
  // 3. status が 402 でなければ早期リターン
  // 4. 必要な情報をログ出力
  // ===========================================================================
  console.log("\n1. Requesting payment quote...");



  // ===========================================================================

  console.log(`   Required: ${quote.payment.amountUSDC} USDC`);
  console.log(`   Recipient: ${quote.payment.tokenAccount}`);

  // ===========================================================================
  // TODO 3: 支払い情報を変数に格納
  // - recipientTokenAccount: quote.payment.tokenAccount から PublicKey を作成
  // - mint: quote.payment.mint から PublicKey を作成  
  // - amount: quote.payment.amount を取得
  // ===========================================================================
  console.log("\n2. Creating payment transaction...");



  // ===========================================================================

  // ===========================================================================
  // TODO 4: 支払い元のToken Accountを取得
  // - getOrCreateAssociatedTokenAccount() を使用
  // - 引数: connection, payer, mint, payer.publicKey
  // - 残高をログ出力
  // - 残高不足の場合は早期リターン
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 5: USDC送金トランザクションを作成
  // - createTransferInstruction() を使用
  // - 引数: source, destination, owner, amount, [], TOKEN_PROGRAM_ID
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 6: トランザクションを構築して署名
  // 1. connection.getLatestBlockhash() でブロックハッシュを取得
  // 2. new Transaction() でトランザクションを作成
  //    - feePayer: payer.publicKey
  //    - blockhash, lastValidBlockHeight
  // 3. tx.add() で送金トランザクションを追加
  // 4. tx.sign() で署名（送信はしない！）
  // ===========================================================================



  // ===========================================================================

  // ===========================================================================
  // TODO 7: x402形式のペイロードを作成
  // 1. tx.serialize().toString("base64") でシリアライズ
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


