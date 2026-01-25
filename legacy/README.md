# Legacy版（@solana/web3.js）

`@solana/web3.js` を使用した **レガシー実装** です。

## 概要

| 項目 | 内容 |
|------|------|
| SDK | `@solana/web3.js` + `@solana/spl-token` |
| プロトコル | x402 v1（シンプル版） |
| トランザクション送信 | サーバーが直接ブロックチェーンに送信 |
| 推奨用途 | 既存プロジェクトとの互換性 |

## 注意事項

**このディレクトリは移行対象外です。**

- `@solana/web3.js` 1.x は将来的に非推奨になる予定
- 新規プロジェクトでは `@solana/kit` の使用を推奨
- 既存の `@solana/web3.js` プロジェクトの参考用

### 推奨する移行先

| 用途 | 推奨ディレクトリ |
|------|-----------------|
| 学習・プロトタイプ | `kit/` |
| x402プロトコル理解 | `kit-facilitator/` |
| **本番環境** | `kit-facilitator-cdp/` |

## セットアップ

```bash
cd legacy
npm install
cp .env.example .env
# .env を編集して RECIPIENT_WALLET を設定
```

## 実行方法

```bash
# サーバー起動
npx ts-node server.sample.ts

# 別ターミナルでクライアント実行
npx ts-node client.sample.ts
```

**注意**: `client.json` と `server.json` はルートディレクトリに配置してください。

## ファイル構成

| ファイル | 説明 |
|---------|------|
| `server.ts` | サーバー（テンプレート） |
| `client.ts` | クライアント（テンプレート） |
| `server.sample.ts` | サーバー完成版 |
| `client.sample.ts` | クライアント完成版 |

## @solana/web3.js の特徴

```typescript
// 接続
import { Connection } from "@solana/web3.js";
const connection = new Connection("https://api.devnet.solana.com");

// キーペア
import { Keypair } from "@solana/web3.js";
const keypair = Keypair.fromSecretKey(secretKeyBytes);

// 公開鍵
import { PublicKey } from "@solana/web3.js";
const pubkey = new PublicKey("4pHdN9Q...");
```

## @solana/kit への移行

新しいプロジェクトでは `@solana/kit` への移行を推奨：

| 旧 (@solana/web3.js) | 新 (@solana/kit) |
|---------------------|------------------|
| `new Connection(url)` | `createSolanaRpc(url)` |
| `Keypair.fromSecretKey()` | `createKeyPairSignerFromBytes()` |
| `new PublicKey(str)` | `address(str)` |
| `publicKey.toBase58()` | そのまま文字列 |
| `new Transaction()` | `createTransactionMessage()` + `pipe()` |
| `@solana/spl-token` | `@solana-program/token` |

詳細は `kit/README.md` を参照してください。

## Devnet USDC

| 項目 | 値 |
|------|-----|
| Mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| 小数点 | 6桁 |
| Faucet | [Circle Faucet](https://faucet.circle.com/) |

## 参考リンク

- [@solana/web3.js NPM](https://www.npmjs.com/package/@solana/web3.js)
- [@solana/spl-token NPM](https://www.npmjs.com/package/@solana/spl-token)
- [Solana公式ガイド: x402](https://solana.com/ja/developers/guides/getstarted/intro-to-x402)
