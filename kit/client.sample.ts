// x402 Client - 完成版サンプル (@solana/kit版)
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
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
// @solana/kit のRPCクライアントを作成
const rpc = createSolanaRpc(rpcUrl);
const PORT = process.env.PORT || 3001;

// クライアントのウォレット（秘密鍵）を読み込む関数
async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("../client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

async function payAndAccess() {
  // Keypair を非同期で読み込み
  const payer = await loadPayer();

  console.log("=== x402 Client Demo ===");
  console.log(`Payer: ${payer.address}`);

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

  const recipientTokenAccount = address(quote.payment.tokenAccount);
  const mint = address(quote.payment.mint);
  const amount = BigInt(quote.payment.amount);

  // 支払い元のToken Account アドレスを取得
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

  // 5. 署名（送信はしない！サーバーに送る）
  const signedTx = await signTransactionMessageWithSigners(transactionMessage);

  // 6. シリアライズしてBase64に変換
  const serializedTx = getBase64EncodedWireTransaction(signedTx);

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

