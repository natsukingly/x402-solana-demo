// x402 Client - 完成版サンプル
import "dotenv/config";
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

// 環境変数から設定を読み込み
const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com");
const PORT = process.env.PORT || 3001;

// クライアントのウォレット（秘密鍵）
const keypairData = JSON.parse(readFileSync("./client.json", "utf-8"));
const payer = Keypair.fromSecretKey(Uint8Array.from(keypairData));

async function payAndAccess() {
  console.log("=== x402 Client Demo ===");
  console.log(`Payer: ${payer.publicKey.toBase58()}`);

  // 1. まず支払い要件を取得（402レスポンス）
  console.log("\n1. Requesting payment quote...");
  const quoteResponse = await fetch(`http://localhost:${PORT}/premium`);
  const quote = await quoteResponse.json() as PaymentQuote;

  if (quoteResponse.status !== 402) {
    console.log("Unexpected response:", quote);
    return;
  }

  console.log(`   Required: ${quote.payment.amountUSDC} USDC`);
  console.log(`   Recipient: ${quote.payment.tokenAccount}`);

  // 2. トランザクションを作成
  console.log("\n2. Creating payment transaction...");

  const recipientTokenAccount = new PublicKey(quote.payment.tokenAccount);
  const mint = new PublicKey(quote.payment.mint);
  const amount = quote.payment.amount;

  // 支払い元のToken Accountを取得（なければ作成）
  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  console.log(`   Payer Token Account: ${payerTokenAccount.address.toBase58()}`);
  console.log(`   Balance: ${Number(payerTokenAccount.amount) / 1_000_000} USDC`);

  // 残高チェック
  if (Number(payerTokenAccount.amount) < amount) {
    console.error("Insufficient USDC balance!");
    console.log("Get devnet USDC from: https://faucet.circle.com/");
    return;
  }

  // 3. 送金トランザクションを作成
  const transferIx = createTransferInstruction(
    payerTokenAccount.address,  // 送信元
    recipientTokenAccount,       // 送信先
    payer.publicKey,            // 署名者
    amount,                      // 金額
    [],                          // マルチシグ（なし）
    TOKEN_PROGRAM_ID             // 明示的にSPL Token Programを指定
  );

  // 4. トランザクションを構築
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: payer.publicKey,
    blockhash,
    lastValidBlockHeight,
  });

  tx.add(transferIx);

  // 5. 署名（送信はしない！サーバーに送る）
  tx.sign(payer);

  // 6. シリアライズしてBase64に変換
  const serializedTx = tx.serialize().toString("base64");

  // 7. x402形式のペイロードを作成
  const paymentProof = {
    x402Version: 1,
    scheme: "exact",
    network: "solana-devnet",
    payload: {
      serializedTransaction: serializedTx,
    },
  };

  const xPaymentHeader = Buffer.from(
    JSON.stringify(paymentProof)
  ).toString("base64");

  // 8. 支払いヘッダー付きでリクエスト
  console.log("\n3. Sending payment...");

  const paidResponse = await fetch(`http://localhost:${PORT}/premium`, {
    headers: {
      "X-Payment": xPaymentHeader,
    },
  });

  const result = await paidResponse.json() as PaymentResult;

  if (paidResponse.status === 200) {
    console.log("\n=== Payment Successful! ===");
    console.log(`Content: ${result.data}`);
    console.log(`Transaction: ${result.paymentDetails?.explorerUrl}`);
  } else {
    console.log("\n=== Payment Failed ===");
    console.log(result);
  }
}

payAndAccess().catch(console.error);
