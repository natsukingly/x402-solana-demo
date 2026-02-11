# Solana Bootcamp - x402 on Solana コーディング 構成案

**所要時間**: 約59分

シーケンス図は [docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md](docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md) にまとめています。

---

## 実現したいこと

- x402プロトコルの仕組みを理解してもらう
- デモを通じて、x402の挙動を具体的にイメージできるようにする
- 実際にコードをゼロから書いて、支払いフローを体験してもらう

## 方針

| 項目 | 内容 |
|------|------|
| コーディング | 全て手入力（コピペNG） |
| 補完 | エディタの補完機能は積極的に活用 |
| ペース | 視聴者が追えるようゆっくり丁寧に |

---

## タイムライン概要

| セクション | 内容 | 時間 |
|-----------|------|------|
| 1. イントロ | 自己紹介・セッション概要・x402基礎知識 | 3分 |
| 2. デモ | X402 Next.js Solana Template（デモを見ながら基礎を説明） | 5分 |
| 3. アーキテクチャ | Facilitatorの役割解説 | 2分 |
| 4. ハンズオン - サーバー | server.ts をスクラッチで実装 | 20分 |
| 5. ハンズオン - クライアント | client.ts をスクラッチで実装 | 22分 |
| 6. 動作確認 | サーバー・クライアントを実行 | 5分 |
| 7. クロージング | まとめ・次のステップ | 2分 |

**合計**: 約59分

### サーバー実装の内訳（20分）
| ステップ | 内容 | 時間 |
|---------|------|------|
| 4-0 | セットアップと全体像の説明 | 2分 |
| 4-1 | プロジェクトのセットアップ（mkdir, npm init, install） | 3分 |
| 4-2 | Expressアプリの基本セットアップ | 3分 |
| 4-3 | 無料エンドポイント（/free）の作成 | 2分 |
| 4-4 | x402のセットアップ準備（importとパッケージ） | 4分 |
| 4-5 | paymentMiddleware と有料エンドポイント | 5分 |
| 4-6 | サーバー起動と動作確認 | 1分 |

### クライアント実装の内訳（22分）
| ステップ | 内容 | 時間 |
|---------|------|------|
| 5-0 | クライアント実装の概要・キーペア生成・USDC入金 | 3分 |
| 5-1 | ファイル作成とインポート | 3分 |
| 5-2 | 定数とウォレット読み込み | 3分 |
| 5-3 | クライアント初期化 | 3分 |
| 5-4 | 402レスポンス処理 | 4分 |
| 5-5 | 支払いの実行 | 6分 |

## 使用するファイル

コーディングは **ゼロから** 開始します：
- `server.ts` → 新規作成（約45行）
- `client.ts` → 新規作成（約95行）

**実装する量**: 約140行（全て手入力）

---

## 構成で意識した点

| 項目 | 選択 | 理由 |
|------|------|------|
| CDP | 採用 | パッケージ・無料Facilitator・豊富なドキュメントが提供されている |
| X402 Next.js Template | デモで使用 | Solana Foundationコミュニティテンプレート。簡単に動作確認可能 |
| フルスクラッチ実装 | 採用 | 仕組みを深く理解するため、ゼロから実装 |

---

## 1. イントロ（3分）

### 想定しているコメントの例

```
「こんにちは、ブロックチェーンエンジニアの山口夏生です。 

このセクションでは、x402という決済プロトコルを使って、
Solana上で少額決済のアプリケーションを作っていきます。

x402とは、HTTPの402ステータスコード「Payment Required」を活用した支払いフローです。
Solanaのような高速・低コストなブロックチェーンと組み合わせることで、
クレジットカード登録やアカウント作成なしで、暗号資産の少額決済を行えるようになります。

数行のコードを追加するだけで、簡単にトラストレスな決済機能を導入できるのもx402の魅力です。

それでは、さっそく始めていきます。」
```

### 画面
- タイトルスライド or ターミナル画面

---

## 2. デモ - X402 Next.js Solana Template（デモを見ながら基礎を説明）（5分）

### 想定しているコメントの例

```
「
（カメラ目線）最初に、x402が実際にどう動くか、デモを見ながら理解していきます。

Solanaコミュニティの開発テンプレートを使います。
Next.jsベースで、x402の支払いフローが既に組み込まれています。

デモを確認した後、全体の構成やフローの説明をしていきます。」
```

### 操作手順

1. **テンプレートのセットアップ**
   ```bash
   # create-solana-dappコマンドを実行します。
   # solana kit -> （任意入力）x402-demo -> community -> x402-template という順で進めてください。
   npx create-solana-dapp

   必要なパッケージのインストールが行われるので数分お待ちください。
   ```

2. **環境変数の設定**
   ```bash
   # はい、無事テンプレートをローカルにダウンロードすることができました。
   # まず、プロジェクトディレクトリに移動して、システムを動かすのに必要な環境変数を確認していきましょう。
   cd ./x402-demo
   code .env.example

   # .env.exampleファイルには、必要な環境変数のサンプルが定義されています。
   # NEXT_PUBLIC_RECEIVER_ADDRESSは、支払いを受け取るウォレットアドレスです。x402で支払われたUSDCがこのアドレスに送金されます。
   # NEXT_PUBLIC_NETWORKは、使用するSolanaネットワークを指定します。solana-devnetを指定すると、テストネットワークのDevnetを使用します。
   # NEXT_PUBLIC_FACILITATOR_URLは、x402のFacilitatorのURLです。Facilitatorは、支払いの検証と決済を代行するサービスです。デフォルトでは、x402.orgが提供するFacilitatorを使用します。
   # NEXT_PUBLIC_CDP_CLIENT_KEYは、Coinbase Payのクライアントキーです。このテンプレートでは、Coinbase Payを使ってウォレットを作成する機能が含まれています。今回は私が普段テスト用に利用しているphantomウォレットのアカウントを使うので、特に設定は不要です。

   では、このサンプルファイルを複製して、システムに読み込ませていきます。
   特に変更が必要な変数は今回ありません。
   cp .env.example .env.local
  #.env.exampleを.env.localに複製しました。
   ```

3. **アプリの起動**
   ```bash
   # サーバーを起動すると、localhost:3000 でアプリが立ち上がります。
   pnpm dev
   ```

4. **動作確認**
   ```
   「画面を見てみましょう。
   'Access Cheap Content'と'Access Expensive Content'というリンクがあります。

   'Access Cheap Content'をクリックしてみましょう。」
   ```

   **支払いダイアログの説明:**
   ```
   「支払いダイアログが表示されました。
   有料コンテンツを取得するための金額やネットワークなどの情報が記載されています。
   
   開発ツールでも挙動を確認していきます。開発ツールを開いて、Networkタブに移動し、ページをリロードしてください。
   content/cheapへのリクエストに対して402を返却されていることがわかります。
   サーバーからHTTPの402ステータスコードが返ってきています。これがx402の重要な部分です。
   課金が必要なコンテンツにアクセスしようとしているけど、お金を支払う準備ができていませんよ！という意味です。
   
   なお、今回利用するウォレットには事前にテストネットのUSDCを補充してあります。
   
   では、'Pay now'ボタンを押して支払いを実行します。」
   ```

   **支払い完了後:**
   ```
   「支払いが完了しました！猫の有料コンテンツが表示されるようになりましたね。

   実際にオンチェーンでトランザクションが発生しているか確認してみましょう。
   Solana Explorerを開きます。
   （ブラウザで https://explorer.solana.com/?cluster=devnet を開く）
   X分後に実行されたこのトランザクションがx402課金の履歴です。
   USDCのトランスファーが記録されていますね。
   実際にDevnet上で送金が行われたことが確認できました。

   これがx402の基本的な流れです。402エラー → 支払い → 200という流れで、
   HTTPの標準的な挙動として支払い機能が組み込まれています。」
   ```

6. **仕組みの簡単な説明**
   ```
   「最後に設定ファイルの中身を確認していきましょう。
   このテンプレートでは、middleware.tsでルートと価格を設定するだけで、
   支払い用のエンドポイントが自動的に反映される仕様になっています。
   
   middleware.tsを開いてみましょう。
   /content/cheapは$0.01、/content/expensiveは$0.25と設定されています。
   
   （コードを追加）
   このように、数行追加するだけで、例えば$100のsuper-expensiveエンドポイントを
   作成することもできます。x402では、ルートごとに柔軟に価格を設定できるため、
   様々な価格帯のコンテンツを簡単に提供できます。
   
   では、curlでも確認してみましょう。」
   ```

   ```bash
   # curlで追加したsuper-expensiveエンドポイントにアクセスしてみましょう。
   curl -i http://localhost:3000/content/super-expensive
   ```

   ```
   「402 Payment Requiredが返ってきました。
   レスポンスヘッダーを見ると、先ほど設定した$100の支払い要件が含まれていますね。」
   ```

7. **次のステップへの導入**
   ```
   （カメラ目線）「このように、パッケージを使えば数行追加するだけで簡単にx402のエンドポイントをデプロイできます。

   では、この仕組みがどのように実現されているか、全体のフローを見ていきましょう。
   x402のアーキテクチャとFacilitatorの役割について説明します。」
   ```

### 画面
- Next.jsアプリのホーム画面（http://localhost:3000）
- 支払いダイアログ（Payment Required）
- 支払い完了後のコンテンツ表示（猫のメディア）
- middleware.ts（コードの確認）

---

## 3. アーキテクチャ：Facilitatorの役割（2分）

### 想定しているコメントの例

**画面に表示（シーケンス図）:** [docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md](docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md#3-アーキテクチャfacilitatorの役割) を参照

```
「シーケンス図を見ていきます。先ほどのデモの裏側で何が起きていたか、この図で理解しましょう。

構成要素は、Client、Server、Facilitator、ブロックチェーンの4つです。
Facilitatorは任意なので、3つの場合もあります。
Clientは支払い側で、先ほどのデモではブラウザがこの役割です。
AIエージェントやシンプルなスクリプトがClientになるケースもあります。
Serverはコンテンツ提供側、Facilitatorは決済の代行、
ブロックチェーンはトランスファーの実行を担当します。
x402自体にチェーンの制約はありませんが、今回はSolanaを利用しています。
Facilitatorを使うことで、サーバーは決済処理をFacilitatorに任せられるため、
セキュリティリスクや開発工数を抑えられます。

では、デモと照らし合わせて流れを見ていきます。

ステップ1〜2: /content/cheapにアクセスしたとき、Serverが402と支払い要件を返しました。
支払いダイアログが出たのはこの402のためです。
支払い要件には、価格や支払い先アドレス、ネットワークなどの情報が含まれています。

ステップ3〜4: Pay nowを押すと、
Clientが支払い要件に基づいてトランスファートランザクションを作成し、ウォレットで署名します。
署名済みトランザクションをヘッダーに含めて、再度Serverにリクエストを送信します。

ステップ5〜6: Serverは受け取った署名済みトランザクションをFacilitatorに送信して、検証を依頼します。
Facilitatorは署名の正当性やトランザクションの内容を確認し、検証結果を返します。

ステップ7〜9: 検証に問題がなければ、ServerからFacilitatorにトランザクションの送信を依頼します。
Facilitatorがブロックチェーンにトランザクションを送信し、確定を待ちます。
先ほどExplorerで確認したUSDCトランスファーが、まさにこの部分です。

ステップ10〜11: トランザクションが確定すると、Facilitatorが成功をServerに通知します。
Serverは200 OKと共にコンテンツを返します。デモで猫のコンテンツが表示されたのはここです。

（カメラ目線）このように、x402はHTTPの標準的な挙動として支払い機能を簡単に組み込むことができます。」

（この画面のまま、次のセクションに移行）
```

---

## 4. ハンズオン - サーバー実装（20分）

### 4-0. セットアップと全体像の説明（2分）

**想定しているコメントの例:**
```
「x402のイメージが湧いたところで今度は、x402のSDKを利用しながらゼロからコードを書いていきましょう。
学習を目的とした必要最小限の少額決済システムを作成します。

このシステムの動作フローを別のバージョンのシーケンス図で理解していきます。」
```

**画面に表示（ハンズオンで作成したシステムのシーケンス図）:** [docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md](docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md#4-0-ハンズオンで作成するシステムのフロー) を参照

```
「
前回のデモセクションで確認したシーケンス図と基本的な流れは同じです。
4つの構成要素（Client、Server、Facilitator、Blockchain）が登場し、
402エラー → 署名 → 検証 → 決済 → 200という流れで処理が進みます。
ClientとServerは、nodejs環境で機能するtypescriptのコードです。
また今回は最小限の実装なので、Web画面は作成しません。
ブロックチェーンは、引き続きSolana Devnetです。
Facilitatorはコインベースのファシリテーターを利用します。

サーバーの実装について詳細を少し補足していきます。
コインベースの公式SDKが提供するpaymentMiddlewareが重要な役割を果たします。
支払いヘッダーがなければ402と支払い要件を返し、
支払いヘッダーがあればFacilitatorで検証・決済を行い、通過すればコンテンツを返します。

クライアント側の詳細は、別途ご説明します。
シーケンス図の説明は以上です。コーディング作業に移っていきましょう。」
```

### 4-1. プロジェクトのセットアップ（3分）

**想定しているコメントの例:**
```
「まず、プロジェクトをゼロから作成していきます。
ディレクトリを作成して、必要なファイルを準備しましょう。」
```

**ターミナル操作:**
```bash
# x402-appというディレクトリが作成されました。ディレクトリに移動します。
mkdir x402-app
cd x402-app

# npm init -yでpackage.jsonを初期化します。
npm init -y
```

**パッケージのインストール:**
```bash
# まず、基本的なパッケージをインストールします。
# expressは、Node.jsでWebサーバーを作成するためのフレームワークです。
npm install express

# TypeScriptで書くので、開発用にtypescriptとtsxもインストールします。
# tsxは、TypeScriptファイルを直接実行するためのツールです。
# @types/expressと@types/nodeは、TypeScriptの型定義ファイルです。
npm install -D typescript @types/express @types/node tsx
```

**ファイル作成:**
```bash
# server.tsファイルを作成して、コードを書いていきます。
touch server.ts
code server.ts
```

---

### 4-2. Expressアプリの基本セットアップ（3分）

**想定しているコメントの例:**
```
「
まず、基本的なExpressアプリを作成しましょう。」
```

**コーディング（1行ずつ手入力）:**
```typescript
// 最初に、expressとRequest, Responseの型をインポートします。
import express from "express";
import type { Request, Response } from "express";

// 次に、ExpressアプリのインスタンスとJSON形式のリクエストを処理するためのミドルウェアを追加しますね。
const app = express();
app.use(express.json());

// まず動作確認のために、app.listen()でサーバーを3001ポートで起動します。
app.listen(3001, () => {
  console.log(`Server running on http://localhost:3001`);
});
```

**動作確認:**
```bash
# サーバーを起動してみましょう。ターミナルに 'Server running on http://localhost:3001' と表示されれば成功です。Ctrl+Cで停止できます。
npx tsx server.ts
# ターミナルで確認
# はい、うまく起動していることを確認できました。
```

---

### 4-3. 無料エンドポイント（/free）の作成（2分）

**コーディング:**
```typescript
// では、最初のエンドポイントを作成していきましょう。まずは、支払い不要の無料エンドポイントを作ります。
// 誰でもアクセスできるシンプルなエンドポイントです。
app.get("/free", (req: Request, res: Response) => {
  res.json({ data: "This is free content" });
});
```

**動作確認:**
```bash
# サーバーを起動した状態で、別のターミナルからアクセスしてみましょう。
curl http://localhost:3001/free
```

```
「curlコマンドで/freeエンドポイントにアクセスします。
レスポンスに 'This is free content' が返ってくれば成功です。」
（実行）
```

---

### 4-4. x402のセットアップ準備（importとパッケージ）（4分）

**説明:**
今度は、x402を使った支払い処理を実装するために、必要なライブラリをインストールしていきます。

**パッケージのインストール:**
```bash
# x402関連のパッケージをインストールします。
# 今回利用するのはCoinbaseが提供する公式SDKです。
npm install @x402/core @x402/svm @x402/express
# @x402/coreは、x402プロトコルのコア機能を提供します。
# @x402/svmは、Solana Virtual Machine（SVM）用のx402実装です。
# @x402/expressは、Expressアプリにx402の支払い機能を簡単に組み込むためのミドルウェアです。
# これらのSDKを使って、x402の支払いフローを実装します。
# server.tsに戻ってコーディングを再開します。
```

**コーディング（1行ずつ手入力）:**
```typescript
// 先ほどインストールした@x402/expressからpaymentMiddlewareをインポートします。
// これがExpressアプリにx402の支払い機能を組み込むためのミドルウェアです。
import { paymentMiddleware } from "@x402/express";

// @x402/core/serverからは、x402ResourceServerとHTTPFacilitatorClientをインポートしますね。
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
// x402ResourceServerは支払いの検証・決済を扱う窓口、HTTPFacilitatorClientはFacilitatorと通信するためのクライアントです。

// 続いて、@x402/svm/exact/serverからはExactSvmSchemeをインポートします。
// ExactSvmSchemeは、指定した金額ぴったりを要求するSolana用の支払いスキームです。
import { ExactSvmScheme } from "@x402/svm/exact/server";

```

---

### 4-5. paymentMiddleware と有料エンドポイント（5分）

**想定しているコメントの例:**
```
「x402のコア部分を実装していきましょう。
@x402/expressのpaymentMiddlewareを使うと、
支払いの検証・決済処理をミドルウェアが自動で行ってくれます。」
```

**コーディング（1行ずつ手入力）:**
```typescript
// まず、HTTPFacilitatorClientを作成します。
// これがFacilitatorと通信するクライアントです。
// Coinbase Facilitatorを使用してトランザクションの検証・送信を行います。
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

// x402ResourceServerを作成し、SVMスキームを登録します。
// "solana:*"はDevnet/Mainnetを問わずSolana全体を対象にします。
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("solana:*", new ExactSvmScheme());

// routesで支払い要件を定義します。
// payToには、自分のウォレットアドレスを直接記述します。
const routes = {
  "GET /premium": {
    accepts: {
      scheme: "exact",
      network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const,
      payTo: "<自分のウォレットアドレスを記述>",
      price: "$0.01",
    },
  },
};
// networkにはCAIP-2形式のネットワーク識別子を指定する必要があります。
// CAIP-2はブロックチェーンネットワークを一意に識別するための標準フォーマットです。
// ドキュメントで確認してみましょう。
// （ブラウザで https://docs.cdp.coinbase.com/x402/network-support を開く）
// このページにx402がサポートするネットワークとCAIP-2識別子の一覧があります。
// Solana Devnetの識別子は "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" です。これをnetworkに指定します。
// `as const`は、TypeScriptが`network`を`string`型として推論するのを防ぎ、x402ライブラリが期待するリテラル型として扱うためのものです。
// payToには受取先アドレスを、priceはドル形式で価格を指定しています。


// 最後にpaymentMiddlewareをExpressのミドルウェアとして適用します。
app.use(paymentMiddleware(routes, resourceServer));
// ここがポイントです。
// たったこの1行で、routesに定義したエンドポイントに対して、
// 支払いヘッダーの抽出・検証（/verify）・決済（/settle）・402レスポンスの返却がすべて自動で行われます。


// /premiumエンドポイントです。
// /freeとほぼ同じ書き方ですが、paymentMiddlewareがこのエンドポイントへのリクエストをインターセプトして、
// 支払いヘッダーがなければ402を返し、支払いが検証・決済されたらこのハンドラーに処理が渡ります。
// つまり、このハンドラーが実行される時点で、支払いは既に完了しています。
app.get("/premium", (req: Request, res: Response) => {
  res.json({ data: "This is premium content!" });
});

// これでサーバーの実装は完成です！
// /freeは無料、/premiumは支払いが必要になります。
// 同じようなエンドポイントでも、paymentMiddlewareを追加するだけで有料化できることがわかりますね。
```

---

### 4-6. サーバー起動と動作確認（1分）

**ターミナル操作:**
```bash
# サーバーの実装が完了しました。動作確認のため、サーバーを起動してみましょう。
# サーバーを起動します。'Server running on http://localhost:3001'と表示されればOKです。
npx tsx server.ts
```

**別のターミナルで動作確認:**
```bash
# 別のターミナルを開いて、動作確認を行います。
# /freeエンドポイントにアクセスすると、無料コンテンツが返ってきます。
curl http://localhost:3001/free

# /premiumエンドポイントにアクセスすると、402 Payment Requiredが返ってきます。
# これは、支払いヘッダーがないため、サーバーが支払いを要求しているためです。
curl http://localhost:3001/premium

# クライアント側で支払い処理を実装すれば、このエンドポイントから有料コンテンツが返ってくるようになります。
# これでサーバー側の実装は完了です。
```

---

## 5. ハンズオン - クライアント実装（22分）

### 5-0. クライアント実装の概要・キーペア生成・USDC入金（3分）

**画面に表示（シーケンス図）:** [docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md](docs/BOOTCAMP_DIAGRAMS_EXPRESS_SDK.md#5-0-クライアント実装の概要) を参照

**想定しているコメントの例:**
```
「次はクライアントを作成します。
クライアントは支払いを行う側、つまりユーザーやAIエージェントの役割です。

シーケンス図を見て、クライアントが行う処理を再度確認していきましょう。。
クライアント側では、初回リクエストの後、
まず402レスポンスから支払い要件を抽出します。
次にその要件をベースとしたトランザクションを作成して署名を行います。
署名済みトランザクションをエンコードします。
2回目同じエンドポイントにリクエストする際ににPAYMENT-SIGNATUREヘッダーとして付与します。

サーバー側の実装は完了しているので、クライアント側を実装すれば、
最後のステップで、200OKと有料コンテンツが返ってくるようになります。

では実装の方に移ります。
まず、クライアント用のキーペアを生成してから、新規ファイルを作成していきます。」
```

**キーペア生成:**
```bash
# クライアント用のキーペアを生成します。
solana-keygen new --outfile client.json --no-bip39-passphrase
```

**※ 画面に秘密のフレーズ（シードフレーズ）が表示された場合（目安：約37:19頃）:**
```
「コマンド実行後に秘密鍵が出力されます。テスト用途のみで利用する予定なので問題ありません。皆さんも実際に作るときは厳重に管理し、絶対に他の人に共有しないでください。」
```

**Devnet USDC の入金:**

```bash
# クライアントは支払い側なので、USDCが必要です。生成したアドレスにDevnet USDCを入金します。
# Devnet USDCを取得します（支払い用）。
# https://faucet.circle.com/ にアクセスし、
# ネットワークを「Solana Devnet」に設定して、アドレスを入力します。
# これでテスト用のUSDCがウォレットに入金されます。
# なお、場合によってはトランザクション手数料（ガス代）のSOLを用意する必要がありますが、今回の仕様ではファシリテーターが負担するような仕様になっています。

# （ブラウザでfaucetを操作）
# エクスプローラーで確認
# 入金が確認できました。これでクライアントの準備は完了です。」
```

---

### 5-1. ファイル作成とインポート（3分）

**パッケージのインストール:**
```bash
# クライアント側でキーペアの読み込みに使用します。
npm install @solana/kit
```

**ファイル作成:**
```bash
// ではClient側のファイルを作成して、実装に移ります。
code client.ts
```

**コーディング（1行ずつ手入力）:**
```typescript
// 必要なライブラリをインポートしていきましょう。
//　先ほど生成したキーペアのclient.jsonファイルを読み込むためのモジュールをインポートしていきます。。
import { readFileSync } from "fs";

// 次に、@solana/kitからcreateKeyPairSignerFromBytesをインポートします。
import { createKeyPairSignerFromBytes } from "@solana/kit";
// 生成したキーペアデータから、トランザクションに署名するためのキーペアオブジェクトを作成するために使います。

// x402のクライアントライブラリをインポートしていきます。 
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
// @x402/core/clientと@x402/core/httpは、クライアント側のx402機能を提供します。

// 続いて、@x402/svmからtoClientSvmSignerをインポートします。
// キーペアオブジェクトをx402形式に変換するアダプターです。
import { toClientSvmSigner } from "@x402/svm";
// 最後に、registerExactSvmSchemeをインポートしますね。
// クライアント用の'exact'スキーム登録関数です。
import { registerExactSvmScheme } from "@x402/svm/exact/client";
```

---

### 5-2. 定数とウォレット読み込み（3分）

**想定しているコメントの例:**
```
「次に、loadPayer関数を実装します。
client.jsonから秘密鍵を読み込み、支払いトランザクションに署名するためのオブジェクトを返す関数です。
```

**コーディング（1行ずつ手入力）:**
```typescript

async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("client.json", "utf-8"));
  // client.jsonを読み込み、キーペアのバイト配列を取得
  // バイト配列をUint8Arrayに変換し、署名用オブジェクトを作成（支払いTxの署名に使用）
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}
```

---

### 5-3. payAndAccess関数 - クライアント初期化（3分）

**想定しているコメントの例:**
```
「payAndAccess関数を実装します。
この関数が支払いフロー全体を担当します。

まずはx402クライアントの初期化を行います。」
```

**コーディング（1行ずつ手入力）:**
```typescript
// payAndAccess関数を実装します。この関数が支払いフロー全体を担当します。
async function payAndAccess() {
  // まず、loadPayerでウォレットを読み込みますね。アドレスをコンソールに表示しておきます。
  const payer = await loadPayer();
  console.log(`Payer: ${payer.address}`);

  // 次に、toClientSvmSignerで、@solana/kitのキーペアオブジェクトをx402ライブラリが使用できる形式に変換します。
  const signer = toClientSvmSigner(payer);

  // 続いて、x402Clientを作成します。
  const coreClient = new x402Client();
  // コアクライアントにサーバーと同じexactスキームを登録。
  registerExactSvmScheme(coreClient, { signer });
  // 最後に、x402HTTPClientを作成しますね。これはx402に対応させるためのHTTP通信のラッパーです。
  const client = new x402HTTPClient(coreClient);
```

---

### 5-4. 402レスポンスの処理（4分）

**想定しているコメントの例:**
```
「次に、サーバーにリクエストを送ります。
支払いヘッダーなしでアクセスしますので、
402 Payment Requiredが返ってくるはずです。
```

**コーディング（1行ずつ手入力）:**
```typescript
  // まず、fetchでサーバーの/premiumエンドポイントにリクエストを送ります。
  const response = await fetch("http://localhost:3001/premium");

  if (response.status !== 402) {
    console.error("Unexpected status:", response.status);
    return;
  }

  const body = await response.json();

  // getPaymentRequiredResponseで、402レスポンスのヘッダーとボディから支払い要件を抽出します。
  // 第1引数はヘッダー取得関数、第2引数はレスポンスボディです。
  const paymentRequirement = client.getPaymentRequiredResponse(
    (name) => response.headers.get(name), // ヘッダー名から値を返す関数
    body
  );

  console.log("Payment requirements:", paymentRequirement);
}
  // payAndAccessを呼び出して実行します。
  payAndAccess().catch(console.error);
```

**動作確認（サーバー起動中に別ターミナルで実行）:**
```bash
# ここで一度、支払い要件を取得できているか確認していきます。
npx tsx client.ts
```

```
「Payerアドレスと、Payment requirements: {...} が表示されればOKです。
価格や支払い先アドレス、networkなどの支払い要件が抽出できているか確認できたので、次は支払い処理を実装します。」
```

---

### 5-5. 支払いの実行（6分）

**コーディング（1行ずつ手入力）:**
```typescript
  // ここからがClient実装の本番です。
  try {
    // まずcreatePaymentPayloadで署名済みトランザクションを作成します。
    const paymentPayload = await client.createPaymentPayload(paymentRequirement);
    // （カメラ目線）このメソッドの内部では、
    // 支払い要件に基づいてUSDCトランスファートランザクションを構築し、
    // クライアントの秘密鍵で署名しています。
    // ただこの時点ではトランザクションはまだブロックチェーンに送信されていないことが重要です。
    // クライアントは署名だけを行い、
    // 実際のブロックチェーンへのブロードキャストはFacilitatorが行います。　

    // （カメラ目線）次に、支払いペイロードをHTTPヘッダーに含められる形式にエンコードします。
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);

    // 最後に、支払いヘッダーを付けて、サーバーに再リクエストを送信します。
    // 最初と同じように、fetchを使ってAPIにリクエストします。
    const paidResponse = await fetch("http://localhost:3001/premium", {
      headers: { ...paymentHeaders },
    });

    // ステータスコードが200以外の場合はエラーとして処理します。
    if (paidResponse.status !== 200) {
      console.error("Payment failed, status:", paidResponse.status);
      return;
    }

    // レスポンスが200なら成功です。レスポンスボディからコンテンツを取得します。
    const data = await paidResponse.json();
    console.log("Payment successful!");
    console.log("Content:", JSON.stringify(data));
  } catch (err) {
    console.error("Payment or access failed:", err);
  }
}

```

---

## 6. 動作確認（5分）

**ターミナル操作:**
```bash
# コードが書けましたので、実際に動かしてみましょう。サーバーとクライアントを別々のターミナルで起動します。
# ターミナル1: サーバー起動
# サーバーを起動します。'Server running on http://localhost:3001'と表示されればOKです。
npx tsx server.ts
```

```bash
# ターミナル2: クライアント実行
npx tsx client.ts
```

**期待される出力:**
```
Payer: 4pHdN9Q...
Payment requirements: {"accepts":[...],...}
Payment successful!
Content: {"data":"This is premium content!"}
```

**想定しているコメントの例:**
```

出力を確認してみましょう。
Payment successful!と表示されました。
コンテンツが返ってきていますね。
```

**Solana Explorerで確認:**
```
「実際に送金されたUSDCのトランザクションをSolana Explorerで確認してみましょう。
支払いで利用したアドレスをコピーして、https://explorer.solana.com/?cluster=devnet で表示します。

これにより、プロトコルが正しくオンチェーンと連動していることが確認できます。
実際にDevnet上でUSDCが送金されていることがわかります。

これがx402の支払いフローです。
クライアントが署名したトランザクションを、
サーバー経由でFacilitatorがブロックチェーンに送信し、
決済が完了しています。」
```

---

## 7. クロージング（2分）

**想定合計: 約59分**

### 想定しているコメントの例

```
「これでx402を使った少額決済の実装が完了しました。

今回作成したサーバーとクライアントをベースに、
ぜひ色々と試してみてください。

x402はまだ新しいプロトコルですが、
AIエージェントの普及とともに、今後ますます注目されていく技術だと考えています。

以上で、x402のセクションを終わります。
お疲れ様でした。」
```

### 画面
- 完成したコードの表示

**完成版コード（server.ts）:**
```typescript
// x402 Server - 完成版サンプル (@x402/express + @x402/svm 公式パッケージ使用)
import express from "express";
import type { Request, Response } from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";

const app = express();
app.use(express.json());

// Facilitatorクライアントとリソースサーバーを作成
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("solana:*", new ExactSvmScheme());

// 支払い要件を定義（payToには自分のウォレットアドレスを直接記述）
const routes = {
  "GET /premium": {
    accepts: {
      scheme: "exact",
      network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const,
      payTo: "<自分のウォレットアドレスを記述>",
      price: "$0.01",
    },
  },
};

// paymentMiddlewareを適用（402返却・検証・決済を自動処理）
app.use(paymentMiddleware(routes, resourceServer));

app.get("/free", (req: Request, res: Response) => {
  res.json({ data: "This is free content" });
});

app.get("/premium", (req: Request, res: Response) => {
  res.json({ data: "This is premium content!" });
});

app.listen(3001, () => {
  console.log(`Server running on http://localhost:3001`);
});
```

**完成版コード（client.ts）:**
```typescript
// x402 Client - Solana USDC Payment
import { readFileSync } from "fs";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";

async function loadPayer() {
  const keypairData = JSON.parse(readFileSync("client.json", "utf-8"));
  return await createKeyPairSignerFromBytes(Uint8Array.from(keypairData));
}

async function payAndAccess() {
  const payer = await loadPayer();
  console.log(`Payer: ${payer.address}`);

  const signer = toClientSvmSigner(payer);
  const coreClient = new x402Client();
  registerExactSvmScheme(coreClient, { signer });
  const client = new x402HTTPClient(coreClient);

  // 1回目: 支払いなしでリクエスト → 402が返る
  const response = await fetch("http://localhost:3001/premium");

  if (response.status !== 402) {
    console.log("Unexpected status:", response.status);
    return;
  }

  // 402レスポンスから支払い要件を抽出
  const body = await response.json();
  const paymentRequirement = client.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );

  if (!paymentRequirement) {
    console.error("Failed to extract payment requirements");
    return;
  }

  console.log("Payment requirements:", JSON.stringify(paymentRequirement));

  // 支払いペイロードを作成・署名
  try {
    const paymentPayload = await client.createPaymentPayload(paymentRequirement);
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);

    // 2回目: 支払いヘッダー付きでリクエスト → 200が返る
    const paidResponse = await fetch("http://localhost:3001/premium", {
      headers: { ...paymentHeaders },
    });

    if (paidResponse.status !== 200) {
      console.error("Payment failed, status:", paidResponse.status);
      return;
    }

    const data = await paidResponse.json();
    console.log("Payment successful!");
    console.log("Content:", JSON.stringify(data));
  } catch (err) {
    console.error("Payment or access failed:", err);
  }
}

payAndAccess().catch(console.error);
```

- 動作確認の結果

---

## 補足: 準備チェックリスト

### 事前準備

- [ ] Node.js（v18以上）がインストールされている
- [ ] Solana CLIがインストールされている（`solana --version`で確認可能）
  - インストール方法: https://docs.solana.com/cli/install-solana-cli-tools
- [ ] エディタのフォントサイズを大きく設定
- [ ] Phantom Walletのパスワードを入力してロック解除しておく
- [ ] 検索履歴の削除
- [ ] デモ用のX402 Next.js Templateを事前に動作確認しておく
- [ ] テスト用キーペア（クライアント側）にDevnet USDCを入金済み
- [ ] 受取先ウォレット（payToに記述するアドレス）にDevnet USDCを入金済み（ATA作成に必要）

### .envファイル（テスト用キーペア含む）

⚠️ **重要**: これはテスト用の公開されたキーペアです。**Mainnetでは絶対に使用しないでください**。

**セキュリティに関する注意事項:**
- この動画用に使い捨ての鍵を使用しています。この鍵は動画終了後に破棄してください。
- 本番環境では、ウォレット接続（Phantom等）を使い、秘密鍵をファイルに保存しません。
- `client.json`には秘密鍵が含まれています。`.gitignore`に追加して、Gitにコミットしないようにしてください。
- 本番環境では絶対に秘密鍵をファイルに保存しないでください。

**注意**: 今回はハードコードで実装するため、環境変数ファイル（.env）は使用しません。
設定値はコード内に直接記述します。

| 用途 | アドレス |
|------|---------|
| Client（支払い側） | `Fz7qLnp9qVNTofMBnft3ZKKmVzMwuiAMg8Sf49rjNkqt` |
| 受取先（payTo・自分のウォレット） | 各自で用意 |

### Devnet USDCの入金方法（参考）

自分でキーペアを作成する場合：
1. `solana-keygen new --outfile client.json --no-bip39-passphrase`
2. https://faucet.circle.com/ でDevnet USDCを取得
※ トランザクション手数料はCoinbaseのFacilitatorが負担するため、Devnet SOLの取得は不要です。

## タイムスタンプメモ用

| 時間 | セクション | 完了チェック |
|------|-----------|-------------|
| 0:00 | 1. イントロ開始 | |
| 3:00 | 2. デモ（X402 Next.js Template）開始 | |
| 8:00 | 3. アーキテクチャ：Facilitatorの役割 | |
| 10:00 | 4. ハンズオン - サーバー実装開始 | |
| 10:00 | 4-0. セットアップと全体像の説明 | |
| 12:00 | 4-1. プロジェクトセットアップ | |
| 15:00 | 4-2. Expressアプリの基本セットアップ | |
| 18:00 | 4-3. 無料エンドポイント作成 | |
| 20:00 | 4-4. x402のセットアップ準備 | |
| 24:00 | 4-5. paymentMiddleware と有料エンドポイント | |
| 29:00 | 4-6. サーバー起動と動作確認 | |
| 30:00 | 5. ハンズオン - クライアント実装開始 | |
| 30:00 | 5-0. クライアント実装の概要・キーペア生成・USDC入金 | |
| 33:00 | 5-1. ファイル作成とインポート | |
| 36:00 | 5-2. 定数とウォレット読み込み | |
| 39:00 | 5-3. payAndAccess関数 - クライアント初期化 | |
| 42:00 | 5-4. 402レスポンスの処理 | |
| 46:00 | 5-5. 支払いの実行 | |
| 52:00 | 6. 動作確認 | |
| 57:00 | 7. クロージング | |
| 59:00 | 終了 | |

**想定合計時間: 約59分**

