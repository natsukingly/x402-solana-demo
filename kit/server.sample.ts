// x402 Server - 完成版サンプル (@solana/kit版)
import "dotenv/config";
import express from "express";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  getTransactionDecoder,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

// 環境変数から設定を読み込み
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const wsUrl = process.env.SOLANA_WS_URL || rpcUrl.replace("https://", "wss://").replace("http://", "ws://");

// @solana/kit のRPCクライアントを作成
const rpc = createSolanaRpc(rpcUrl);
const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);

// sendAndConfirmTransaction ファクトリを作成
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

const USDC_MINT = address(process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const RECIPIENT_WALLET = address(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = Number(process.env.PRICE_USDC) || 100;
const PORT = Number(process.env.PORT) || 3001;

// TOKEN_PROGRAM_ADDRESS を文字列として取得
const TOKEN_PROGRAM_ADDRESS_STR = TOKEN_PROGRAM_ADDRESS as string;

const app = express();
app.use(express.json());

app.get("/premium", async (req, res) => {
  const xPaymentHeader = req.header("X-Payment");

  if (xPaymentHeader) {
    try {
      // 1. X-Payment ヘッダーをデコード
      const paymentData = JSON.parse(Buffer.from(xPaymentHeader, "base64").toString("utf-8"));
      const serializedTx = paymentData.payload.serializedTransaction;

      // 2. Base64 トランザクションをデコード
      const txBytes = Uint8Array.from(Buffer.from(serializedTx, "base64"));
      const transactionDecoder = getTransactionDecoder();
      const tx = transactionDecoder.decode(txBytes);

      // 3. 受取先 Token Account を計算
      const [recipientTokenAccount] = await findAssociatedTokenPda({
        mint: USDC_MINT,
        owner: RECIPIENT_WALLET,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      let validTransfer = false;
      let transferAmount = 0;

      // 4. トランザクションの命令を検証
      // トランザクションメッセージから命令を取得
      const message = tx.messageBytes;

      // シンプルなバイナリ解析でTransfer命令を検証
      // Token Program の Transfer 命令: data[0] === 3
      // 注意: この検証は基本的なもので、実運用ではより厳密な検証が必要

      // 署名済みトランザクションのバイナリから直接検証する代わりに、
      // RPC経由で送信後に検証するか、より詳細なデコードを行う必要がある

      // 簡易検証: シリアライズされたトランザクション全体を検索
      // Token Transfer命令は data[0] = 3 で始まり、8バイトの金額が続く
      const txBuffer = Buffer.from(txBytes);

      // Token Program Address をバイナリで探す
      const tokenProgramBytes = Buffer.from(
        // Base58 decode of TOKEN_PROGRAM_ADDRESS
        // TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
        [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169]
      );

      // トランザクション内の各位置でトークン送金を探す
      // これは簡易的な方法で、実際のプロダクションコードではより正確な解析が必要
      for (let i = 0; i < txBuffer.length - 40; i++) {
        // Transfer instruction discriminator を探す
        if (txBuffer[i] === 3) {
          // 金額を読み取る（8バイト、リトルエンディアン）
          const amount = txBuffer.readBigUInt64LE(i + 1);
          if (amount >= BigInt(PRICE_USDC)) {
            transferAmount = Number(amount);
            validTransfer = true;
            break;
          }
        }
      }

      if (!validTransfer) {
        return res.status(402).json({ error: "Invalid transfer instruction" });
      }

      // 5. トランザクションを送信して確認
      try {
        await sendAndConfirmTransaction(tx as any, {
          commitment: "confirmed",
          skipPreflight: true
        });
      } catch (e: any) {
        // トランザクション送信エラー
        return res.status(402).json({
          error: "Transaction failed on-chain",
          details: e.message || "Unknown error"
        });
      }

      // 6. 署名を取得
      const signature = getSignatureFromTransaction(tx);

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

  // 支払い要件を返す
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
});

app.listen(PORT, () => console.log(`x402 Server running on http://localhost:${PORT}`));

