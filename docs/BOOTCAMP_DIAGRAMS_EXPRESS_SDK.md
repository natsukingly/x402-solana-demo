# Solana Bootcamp - x402 on Solana シーケンス図

BOOTCAMP_PLOT_WITH_COMMENTS_WITH_EXPRESS_SDK.md で使用する図の一覧です。

---

## 3. アーキテクチャ：Facilitatorの役割

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant F as Facilitator
    participant B as Solana

    C->>S: 1. HTTPリクエスト
    S-->>C: 2. 402 + PaymentRequired

    Note over C: 3. PaymentPayload生成（署名）

    C->>S: 4. HTTPリクエスト + PAYMENT-SIGNATURE
    S->>F: 5. /verify
    F-->>S: 6. 検証OK
    S->>F: 7. /settle
    F->>B: 8. トランザクション送信
    B-->>F: 9. confirmed
    F-->>S: 10. success
    S-->>C: 11. 200 + Content
```

---

## 4-0. ハンズオンで作成するシステムのフロー

```mermaid
sequenceDiagram
    participant C as Client(client.ts)
    participant S as Server(server.ts)
    participant F as Facilitator(x402.org)
    participant B as Solana(Devnet)

    Note right of C: ── 1回目のリクエスト（支払いなし → 402） ──

    Note over C: fetch("/premium")
    C->>S: 1. GET /premium
    Note over S: paymentMiddleware が自動処理→ 支払いヘッダーなし → 402返却
    S-->>C: 2. 402 + 支払い要件（価格・payTo・network）

    Note right of C: ── クライアント側の支払い準備 ──

    Note over C: getPaymentRequiredResponse()→ 402レスポンスから支払い要件を抽出
    Note over C: createPaymentPayload(paymentRequired)→ USDCトランスファーTx作成・署名
    Note over C: encodePaymentSignatureHeader(payload)→ ヘッダー形式にエンコード

    Note right of C: ── 2回目のリクエスト（支払いあり → 200） ──

    Note over C: fetch("/premium", { headers })
    C->>S: 3. GET /premium + PAYMENT-SIGNATURE
    Note over S: paymentMiddleware が自動処理→ 支払いヘッダーあり → 検証・決済へ
    S->>F: 4. POST /verify（署名検証）
    F-->>S: 5. 検証OK
    S->>F: 6. POST /settle（決済実行）
    F->>B: 7. Tx送信（USDCトランスファー）
    B-->>F: 8. confirmed
    F-->>S: 9. success + tx hash
    Note over S: ミドルウェア通過 → ルートハンドラーへ
    S-->>C: 10. 200 OK + Content
```

---

## 5-0. クライアント実装の概要

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant F as Facilitator
    participant B as Solana

    C->>S: 1. HTTPリクエスト
    S-->>C: 2. 402 + PaymentRequired

    Note over C: 3. PaymentPayload生成（署名）

    C->>S: 4. HTTPリクエスト + PAYMENT-SIGNATURE
    S->>F: 5. /verify
    F-->>S: 6. 検証OK
    S->>F: 7. /settle
    F->>B: 8. トランザクション送信
    B-->>F: 9. confirmed
    F-->>S: 10. success
    S-->>C: 11. 200 + Content
```
