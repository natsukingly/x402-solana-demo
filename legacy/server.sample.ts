// x402 Server - 完成版サンプル (@solana/web3.js版)
import "dotenv/config";
import express from "express";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// 環境変数から設定を読み込み
const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com");
const USDC_MINT = new PublicKey(process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const RECIPIENT_WALLET = new PublicKey(process.env.RECIPIENT_WALLET!);
const PRICE_USDC = Number(process.env.PRICE_USDC) || 100;
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json());

app.get("/premium", async (req, res) => {
  const xPaymentHeader = req.header("X-Payment");

  if (xPaymentHeader) {
    try {
      const paymentData = JSON.parse(Buffer.from(xPaymentHeader, "base64").toString("utf-8"));
      const txBuffer = Buffer.from(paymentData.payload.serializedTransaction, "base64");
      const tx = Transaction.from(txBuffer);
      const recipientTokenAccount = await getAssociatedTokenAddress(USDC_MINT, RECIPIENT_WALLET);

      let validTransfer = false;
      let transferAmount = 0;

      for (const ix of tx.instructions) {
        if (ix.programId.equals(TOKEN_PROGRAM_ID)) {
          if (ix.data.length >= 9 && ix.data[0] === 3) {
            transferAmount = Number(ix.data.readBigUInt64LE(1));
            if (ix.keys.length >= 2) {
              const destAccount = ix.keys[1].pubkey;
              if (destAccount.equals(recipientTokenAccount) && transferAmount >= PRICE_USDC) {
                validTransfer = true;
                break;
              }
            }
          }
        }
      }

      if (!validTransfer) {
        return res.status(402).json({ error: "Invalid transfer instruction" });
      }

      const simulation = await connection.simulateTransaction(tx);
      if (simulation.value.err) {
        return res.status(402).json({ error: "Simulation failed", details: simulation.value.err });
      }

      const signature = await connection.sendRawTransaction(txBuffer, { skipPreflight: false });
      const confirmation = await connection.confirmTransaction(signature, "confirmed");

      if (confirmation.value.err) {
        return res.status(402).json({ error: "Transaction failed on-chain" });
      }

      return res.json({
        data: "これはプレミアムコンテンツです！支払いありがとうございます。",
        paymentDetails: { signature, amount: transferAmount, amountUSDC: transferAmount / 1_000_000, explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet` },
      });
    } catch (e) {
      return res.status(402).json({ error: "Payment verification failed", details: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  const recipientTokenAccount = await getAssociatedTokenAddress(USDC_MINT, RECIPIENT_WALLET);
  return res.status(402).json({
    message: "Payment Required",
    payment: { recipientWallet: RECIPIENT_WALLET.toBase58(), tokenAccount: recipientTokenAccount.toBase58(), mint: USDC_MINT.toBase58(), amount: PRICE_USDC, amountUSDC: PRICE_USDC / 1_000_000 },
  });
});

app.listen(PORT, () => console.log(`x402 Server running on http://localhost:${PORT}`));


