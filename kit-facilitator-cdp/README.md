# Kit + Facilitator + @x402 公式パッケージ版

Coinbase公式の `@x402/svm` と `@x402/core` パッケージを使用した **推奨実装** です。

## 概要

| 項目 | 内容 |
|------|------|
| SDK | `@solana/kit` + `@x402/svm` + `@x402/core` |
| プロトコル | x402 v2 |
| トランザクション送信 | Facilitator経由（ガスレス） |
| 推奨用途 | **本番環境** |

### 利点

- 公式パッケージによる正しいx402プロトコル実装
- 自動的なヘッダーエンコード/デコード
- V1/V2両方のプロトコルサポート
- 型安全性

詳細なフロー図・コード例・リファレンスは [docs/REFERENCE.md](docs/REFERENCE.md) を参照してください。

## セットアップ

```bash
cd kit-facilitator-cdp
npm install
cp env.example .env
# .env を編集して RECIPIENT_WALLET を設定
```

## 実行方法

```bash
# サーバー起動
npx tsx server.sample.ts

# 別ターミナルでクライアント実行
npx tsx client.sample.ts
```

## ファイル構成

| ファイル | 説明 |
|---------|------|
| `server.ts` | サーバー（テンプレート） |
| `client.ts` | クライアント（テンプレート） |
| `server.sample.ts` | サーバー完成版 |
| `client.sample.ts` | クライアント完成版 |

## 重要な補足事項

### `payTo` にはウォレットアドレスを指定

**`payTo` にはATAではなくウォレットアドレスを指定してください。**

```typescript
// 正しい
payTo: RECIPIENT_WALLET as string,  // ウォレットアドレス

// 間違い（エラーになる）
payTo: recipientTokenAccount as string,  // ATA
```

**理由**: `@x402/svm` ライブラリは内部で以下のようにATAを計算します：

```typescript
const [destinationATA] = await findAssociatedTokenPda({
  mint: paymentRequirements.asset,
  owner: paymentRequirements.payTo,  // payTo を owner として使用
  tokenProgram: tokenProgramAddress
});
```

ATAを渡すと「ATAのATA」を計算しようとして `InvalidAccountData` エラーになります。

> 参考: [x402 SVM Specification](https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_svm.md)
> - "Destination MUST equal the Associated Token Account PDA for (owner = payTo, mint = asset)"

### 価格の指定形式

ドル形式で指定可能：

```typescript
price: "$0.01"      // 0.01 USDC
price: "$1.50"      // 1.50 USDC
price: "0.001"      // 0.001 USDC（$なしも可）
```

## トラブルシューティング

### `InvalidAccountData` エラー

`payTo` にATAを指定している可能性があります。ウォレットアドレスを指定してください。

### `transaction_simulation_failed` エラー

- 受取先のToken Accountが存在するか確認
- クライアントのUSDC残高が十分か確認

## 参考リンク

- [x402 公式サイト](https://www.x402.org/)
- [x402 GitHub](https://github.com/coinbase/x402)
- [@x402/svm NPM](https://www.npmjs.com/package/@x402/svm)
- [@x402/core NPM](https://www.npmjs.com/package/@x402/core)
- [x402 SVM Specification](https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_svm.md)
