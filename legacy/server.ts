// x402 Server - ハンズオン用テンプレート (@solana/web3.js版)
// 各 TODO セクションのコードを実装してください

import express from "express";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// =============================================================================
// TODO 1: 定数を設定してください
// - connection: Solana Devnetへの接続
// - USDC_MINT: Devnet USDCのMintアドレス (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU)
// - RECIPIENT_WALLET: 自分のサーバーウォレットの公開鍵 (server.jsonから取得)
// - PRICE_USDC: 価格 (USDCは6桁の小数点、100 = 0.0001 USDC)
// =============================================================================



// =============================================================================

const app = express();
app.use(express.json());

app.get("/premium", async (req, res) => {
  // X-Paymentヘッダーを取得
  const xPaymentHeader = req.header("X-Payment");

  // 支払いヘッダーがある場合：検証して処理
  if (xPaymentHeader) {
    try {
      // =======================================================================
      // TODO 2: X-Paymentヘッダーをデコードしてトランザクションを取得
      // 1. xPaymentHeader を Base64デコードして JSON.parse
      // 2. paymentData.payload.serializedTransaction を Base64デコード
      // 3. Transaction.from() でトランザクションオブジェクトに変換
      // 4. getAssociatedTokenAddress() で受取先Token Accountを計算
      // =======================================================================



      // =======================================================================

      let validTransfer = false;
      let transferAmount = 0;

      // =======================================================================
      // TODO 3: トランザクション内のインストラクションを検証
      // - tx.instructions をループ
      // - TOKEN_PROGRAM_ID のインストラクションを探す
      // - Transferトランザクション (data[0] === 3) かチェック
      // - 送金額を data.readBigUInt64LE(1) で取得
      // - 送金先が recipientTokenAccount で、金額が PRICE_USDC 以上か確認
      // - 条件を満たせば validTransfer = true
      // =======================================================================



      // =======================================================================

      if (!validTransfer) {
        return res.status(402).json({ error: "Invalid transfer instruction" });
      }

      // =======================================================================
      // TODO 4: トランザクションを処理
      // 1. connection.simulateTransaction() でシミュレート
      // 2. シミュレーション失敗時は 402 エラーを返す
      // 3. connection.sendRawTransaction() で送信
      // 4. connection.confirmTransaction() で確認を待つ
      // 5. 確認失敗時は 402 エラーを返す
      // =======================================================================



      // =======================================================================

      // 成功レスポンス
      return res.json({
        data: "これはプレミアムコンテンツです！支払いありがとうございます。",
        paymentDetails: { 
          signature, 
          amount: transferAmount, 
          amountUSDC: transferAmount / 1_000_000, 
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet` 
        },
      });
    } catch (e) {
      return res.status(402).json({ 
        error: "Payment verification failed", 
        details: e instanceof Error ? e.message : "Unknown error" 
      });
    }
  }

  // ===========================================================================
  // TODO 5: 支払いがない場合、402レスポンスで支払い情報を返す
  // - getAssociatedTokenAddress() で受取先Token Accountを計算
  // - status(402) で以下の情報を含むJSONを返す:
  //   - message: "Payment Required"
  //   - payment: { recipientWallet, tokenAccount, mint, amount, amountUSDC }
  // ===========================================================================



  // ===========================================================================
});

// =============================================================================
// TODO 6: サーバーをポート3001で起動
// =============================================================================




