// x402 Server - ハンズオン用テンプレート (@solana/kit版)
// 各 TODO セクションのコードを実装してください

import express from "express";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  getTransactionDecoder,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  getBase64Decoder,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

// =============================================================================
// TODO 1: 定数とRPCクライアントを設定してください
// - rpcUrl: Solana DevnetのRPC URL
// - wsUrl: WebSocket URL（rpcUrl から変換）
// - rpc: @solana/kit の createSolanaRpc() を使用
// - rpcSubscriptions: createSolanaRpcSubscriptions() を使用
// - sendAndConfirmTransaction: sendAndConfirmTransactionFactory() を使用
// - USDC_MINT: address() で Devnet USDCのMintアドレスを指定
//   (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU)
// - RECIPIENT_WALLET: address() で自分のサーバーウォレットの公開鍵を指定
// - PRICE_USDC: 価格 (USDCは6桁の小数点、100 = 0.0001 USDC)
// =============================================================================

const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const wsUrl = rpcUrl.replace("https://", "wss://").replace("http://", "ws://");
const rpc = createSolanaRpc(rpcUrl);
const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = 100; // 0.0001 USDC
const PORT = 3001;

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
      // 2. paymentData.payload.serializedTransaction を getBase64Decoder() でデコード
      // 3. getTransactionDecoder() でトランザクションオブジェクトに変換
      // 4. findAssociatedTokenPda() で受取先Token Accountを計算
      // =======================================================================



      // =======================================================================

      let validTransfer = false;
      let transferAmount = 0;

      // =======================================================================
      // TODO 3: トランザクション内の命令を検証
      // - トランザクションバイナリを Buffer に変換
      // - Token Transfer 命令 (data[0] === 3) を探す
      // - 金額を data.readBigUInt64LE(1) で取得
      // - 金額が PRICE_USDC 以上か確認
      // - 条件を満たせば validTransfer = true
      // =======================================================================



      // =======================================================================

      if (!validTransfer) {
        return res.status(402).json({ error: "Invalid transfer instruction" });
      }

      // =======================================================================
      // TODO 4: トランザクションを送信
      // 1. sendAndConfirmTransaction() で送信と確認
      //    - { commitment: "confirmed", skipPreflight: true } を指定
      // 2. エラー時は 402 エラーを返す
      // 3. getSignatureFromTransaction() で署名を取得
      // =======================================================================

      // TODO: トランザクションを送信し、署名を取得
      const signature = "TODO_IMPLEMENT"; // getSignatureFromTransaction(tx);

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
  // - findAssociatedTokenPda() で受取先Token Accountを計算
  // - status(402) で以下の情報を含むJSONを返す:
  //   - message: "Payment Required"
  //   - payment: { recipientWallet, tokenAccount, mint, amount, amountUSDC }
  // ===========================================================================

  const [recipientTokenAccount] = await findAssociatedTokenPda({
    mint: USDC_MINT,
    owner: RECIPIENT_WALLET,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  return res.status(402).json({
    message: "Payment Required",
    payment: {
      recipientWallet: RECIPIENT_WALLET,
      tokenAccount: recipientTokenAccount,
      mint: USDC_MINT,
      amount: PRICE_USDC,
      amountUSDC: PRICE_USDC / 1_000_000
    },
  });

  // ===========================================================================
});

// =============================================================================
// TODO 6: サーバーをポート3001で起動
// =============================================================================

app.listen(PORT, () => console.log(`x402 Server running on http://localhost:${PORT}`));

