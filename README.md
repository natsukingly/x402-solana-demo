# x402 Demo - Solana USDC Payment Gateway

HTTP 402 (Payment Required) ステータスコードを使用した、Solana上のUSDC支払いゲートウェイのハンズオンデモです。

> 📖 このデモは [Solana公式ガイド: How to get started with x402 on Solana](https://solana.com/ja/developers/guides/getstarted/intro-to-x402) を参考に実装しています。

## 概要

このデモでは、クライアントがプレミアムコンテンツにアクセスする際に、USDCで支払いを行う仕組みを実装します。

**フロー:**
1. クライアントがサーバーにリクエスト
2. サーバーが402レスポンスで支払い要件を返す
3. クライアントがUSDC転送トランザクションを作成・署名
4. クライアントが`X-Payment`ヘッダーに署名済みトランザクションを含めて再リクエスト
5. サーバーがトランザクションを検証・実行し、コンテンツを返す

## ファイル構成

```
x402-demo/
├── server.ts         # サーバー（ハンズオン用のテンプレート）
├── client.ts         # クライアント（ハンズオン用のテンプレート）
├── server.sample.ts  # サーバー完成版
├── client.sample.ts  # クライアント完成版
├── server.json       # サーバーウォレット（要作成）
├── client.json       # クライアントウォレット（要作成）
├── .env              # 環境変数（要作成）
├── .env.example      # 環境変数テンプレート
├── package.json
└── README.md
```

---

## Part 1: 環境構築

### 1.1 必要なソフトウェア

- **Node.js** v20以上
- **Solana CLI**

### 1.2 Solana CLIのインストール

```bash
# macOS / Linux
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# PATHに追加
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# インストール確認
solana --version
```

### 1.3 プロジェクトのセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd x402-demo

# 依存関係をインストール
npm install
```

---

## Part 2: 事前準備

### 2.1 Solana Devnetに接続

```bash
solana config set --url devnet
```

### 2.2 ウォレットの作成

**サーバー用ウォレット（支払いの受取先）:**
```bash
solana-keygen new --outfile server.json
# 表示されるpubkeyをメモしておく
```

**クライアント用ウォレット（支払い元）:**
```bash
solana-keygen new --outfile client.json
# 表示されるpubkeyをメモしておく
```

### 2.3 環境変数の設定

`.env.example` をコピーして `.env` を作成：
```bash
cp .env.example .env
```

`.env` を編集して `RECIPIENT_WALLET` を設定：
```bash
# サーバーウォレットの公開鍵を確認
solana-keygen pubkey server.json

# .env の RECIPIENT_WALLET を更新
RECIPIENT_WALLET=上記で表示された公開鍵
```

### 2.4 Devnet SOLの取得

```bash
# サーバーウォレットにSOLをエアドロップ
solana airdrop 2 $(solana-keygen pubkey server.json)

# クライアントウォレットにSOLをエアドロップ
solana airdrop 2 $(solana-keygen pubkey client.json)
```

### 2.5 Devnet USDCの取得

1. [Circle Faucet](https://faucet.circle.com/) にアクセス
2. ネットワーク: **Solana Devnet** を選択
3. ウォレットアドレス: クライアントの公開鍵を入力
4. USDCを取得

### 2.6 サーバー用Token Accountの作成

```bash
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
  --owner $(solana-keygen pubkey server.json) \
  --fee-payer server.json
```

---

## Part 3: ハンズオン - サーバー実装

`server.ts` を開いて、各TODOセクションのコードを実装してください。

### TODO 1: 定数を設定

以下の4つの定数を定義してください：

| 変数名 | 内容 | ヒント |
|--------|------|-------|
| `connection` | Solana Devnetへの接続 | `new Connection("https://api.devnet.solana.com")` |
| `USDC_MINT` | Devnet USDC Mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| `RECIPIENT_WALLET` | サーバーウォレット公開鍵 | `solana-keygen pubkey server.json` で確認 |
| `PRICE_USDC` | 価格（6桁小数点） | `100` = 0.0001 USDC |

### TODO 2: X-Paymentヘッダーをデコード

1. `xPaymentHeader` を Base64デコードして `JSON.parse`
2. `paymentData.payload.serializedTransaction` を Base64デコード
3. `Transaction.from()` でトランザクションオブジェクトに変換
4. `getAssociatedTokenAddress(USDC_MINT, RECIPIENT_WALLET)` で受取先Token Account計算

### TODO 3: インストラクション検証

トランザクション内のSPL Token Transfer命令を検証：
- `tx.instructions` をループ
- `TOKEN_PROGRAM_ID` のインストラクションを探す
- Transfer命令（`data[0] === 3`）かチェック
- 送金額を `data.readBigUInt64LE(1)` で取得
- 送金先と金額を検証

### TODO 4: トランザクション処理

1. `connection.simulateTransaction(tx)` でシミュレート
2. `connection.sendRawTransaction(txBuffer, { skipPreflight: false })` で送信
3. `connection.confirmTransaction(signature, "confirmed")` で確認

### TODO 5: 402レスポンス

支払いがない場合、`status(402)` で支払い情報を返す：
```typescript
{
  message: "Payment Required",
  payment: { recipientWallet, tokenAccount, mint, amount, amountUSDC }
}
```

### TODO 6: サーバー起動

`app.listen(3001, ...)` でポート3001で起動

---

## Part 4: ハンズオン - クライアント実装

`client.ts` を開いて、各TODOセクションのコードを実装してください。

### TODO 1: 接続とウォレット設定

| 変数名 | 内容 | ヒント |
|--------|------|-------|
| `connection` | Solana Devnetへの接続 | `new Connection("https://api.devnet.solana.com")` |
| `payer` | クライアントウォレット | `client.json` から `Keypair.fromSecretKey()` で作成 |

### TODO 2: サーバーから支払い情報を取得

1. `fetch("http://localhost:3001/premium")` でリクエスト
2. `response.json()` でJSONパース（`as PaymentQuote` でキャスト）
3. `status !== 402` なら早期リターン

### TODO 3: 支払い情報を変数に格納

```typescript
const recipientTokenAccount = new PublicKey(quote.payment.tokenAccount);
const mint = new PublicKey(quote.payment.mint);
const amount = quote.payment.amount;
```

### TODO 4: 支払い元Token Accountを取得

```typescript
const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, payer.publicKey
);
```
残高チェックも実装（`payerTokenAccount.amount` を使用）

### TODO 5: USDC転送命令を作成

```typescript
const transferIx = createTransferInstruction(
  payerTokenAccount.address,  // source
  recipientTokenAccount,       // destination
  payer.publicKey,            // owner
  amount,                      // amount
  [],                          // multiSigners
  TOKEN_PROGRAM_ID             // programId
);
```

### TODO 6: トランザクション構築と署名

1. `connection.getLatestBlockhash()` でブロックハッシュ取得
2. `new Transaction({ feePayer, blockhash, lastValidBlockHeight })`
3. `tx.add(transferIx)` で命令追加
4. `tx.sign(payer)` で署名（**送信はしない！**）

### TODO 7: x402ペイロード作成

```typescript
const serializedTx = tx.serialize().toString("base64");
const paymentProof = {
  x402Version: 1,
  scheme: "exact",
  network: "solana-devnet",
  payload: { serializedTransaction: serializedTx }
};
const xPaymentHeader = Buffer.from(JSON.stringify(paymentProof)).toString("base64");
```

### TODO 8: X-Paymentヘッダー付きでリクエスト

```typescript
const paidResponse = await fetch("http://localhost:3001/premium", {
  headers: { "X-Payment": xPaymentHeader }
});
```
- `status === 200` なら成功、それ以外は失敗

---

## Part 5: 動作確認

### 5.1 サーバーの起動

```bash
npx ts-node server.ts
```

出力:
```
x402 Server running on http://localhost:3001
```

### 5.2 クライアントの実行

別のターミナルで:

```bash
npx ts-node client.ts
```

成功時の出力例:
```
=== x402 Client Demo ===
Payer: Fz7qLnp9qVNTofMBnft3ZKKmVzMwuiAMg8Sf49rjNkqt

1. Requesting payment quote...
   Required: 0.0001 USDC
   Recipient: 3czoXAXJ9biX2VVLP3oigVcg7stuRxWhJz8be9BkWP5W

2. Creating payment transaction...
   Payer Token Account: 5gtyiVdUhUND9Y9Dt7UbT9GBhmeiMBUh66FSBgVA9kXj
   Balance: 1 USDC

3. Sending payment...

=== Payment Successful! ===
Content: これはプレミアムコンテンツです！支払いありがとうございます。
Transaction: https://explorer.solana.com/tx/xxxxx?cluster=devnet
```

---

## 解答

困ったときは `server.sample.ts` と `client.sample.ts` を参照してください。

---

## トラブルシューティング

### "Non-base58 character" エラー
→ `RECIPIENT_WALLET` が正しいSolana公開鍵になっているか確認

### "InvalidAccountData" エラー
→ サーバー用Token Accountが作成されているか確認（手順2.5参照）

### "Insufficient USDC balance" エラー
→ Circle Faucetからクライアントウォレットに追加でUSDCを取得

### TypeScriptコンパイルエラー
```bash
npm install --save-dev @types/express @types/node
```

---

## 設定

### 価格の変更

`server.ts`の`PRICE_USDC`を変更:

```typescript
// USDCは6桁の小数点を使用
const PRICE_USDC = 100;        // 0.0001 USDC
const PRICE_USDC = 1_000_000;  // 1 USDC
const PRICE_USDC = 10_000_000; // 10 USDC
```

---

## 注意事項

⚠️ **セキュリティ警告**: `server.json`と`client.json`には秘密鍵が含まれています。本番環境では絶対に公開しないでください。

---

## 公式サンプルとの差分

このデモは [Solana公式ガイド](https://solana.com/ja/developers/guides/getstarted/intro-to-x402) のMinimal Server/Clientを参考にしていますが、以下の点で簡略化しています。

### サーバー側

| 項目 | 公式サンプル | このデモ |
|------|-------------|---------|
| Token Account | トップレベルで`await`計算 | ハンドラー内で計算 |
| Connection | `"confirmed"`コミットメント指定 | デフォルト |
| 支払い検証 | トークン残高変化を検証 | インストラクションのamountを使用 |
| 402レスポンス | `cluster`フィールド含む | 含まない |

### クライアント側

| 項目 | 公式サンプル | このデモ |
|------|-------------|---------|
| Keypairパス | `./pay-in-usdc/client.json` | `./client.json` |
| 受取先Token Account | 存在確認し、なければ作成 | 存在前提 |
| network指定 | `cluster`から動的に決定 | `"solana-devnet"`固定 |

本番環境では公式サンプルの検証ロジックを参考にしてください。

---

## 参考リンク

- [Solana公式ガイド: How to get started with x402 on Solana](https://solana.com/ja/developers/guides/getstarted/intro-to-x402)
- [Circle Faucet (Devnet USDC)](https://faucet.circle.com/)
- [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

