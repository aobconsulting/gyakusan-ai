# 🧭 逆算AI — ゴール逆算型タスクスケジューラー

> 「何から始めればいいか分からない」を解消する、AIスケジュール生成ツール

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![GAS](https://img.shields.io/badge/Google%20Apps%20Script-✓-blue.svg)](https://script.google.com/)
[![Gemini API](https://img.shields.io/badge/Gemini%20API-✓-green.svg)](https://ai.google.dev/)

## 🎯 何ができる？

やりたいこと（タスク）を入力すると、AIが対話を通じて**本当のゴール**を見つけ出し、ゴール日から**営業日ベースで逆算**した具体的なスケジュールを自動生成します。

### ✨ 特徴

- **ゴール深掘りAI** — 「提案資料を作る」→「売上を伸ばす」→「顧客に価値を届ける」と、具体⇔抽象を往復して本質的な目的を特定
- **事業計画モード** — 受託型/プロダクト型を自動判定し、フェーズ構造付きのスケジュールを生成
- **6フェーズ選択** — 原点整理、コンセプト設計、ポジショニング、ブランド設計、検証・実行、認知拡大から必要なものだけ選択
- **5ウェイポジショニング** — 価格/商品力/アクセス/サービス/経験価値の5軸で「どこで勝つか」を特定（Crawford & Matthews）
- **AIプロンプト付き** — 各タスクに「AIに投げると良いプロンプト」が付属。そのままChatGPTやClaudeにコピペ可能
- **カレンダー連携** — Googleカレンダーへワンクリックエクスポート
- **ビジネス/プライベート切替** — モードによって口調もアプローチも変化

### 🧠 隠れた価値

使い続けることで「具体⇔抽象」の思考力トレーニングになります。普段の仕事でも「そもそも何のためにやるんだっけ？」と問いかけられる思考習慣が身につきます。

## 🚀 セットアップ（約10分）

### 必要なもの

| 項目 | 詳細 |
|---|---|
| Googleアカウント | Gmail OK（動作保証は Google Workspace） |
| Gemini API キー | [Google AI Studio](https://aistudio.google.com/apikey) で無料取得 |

> 💡 Gemini APIは Google AI Studio 経由の独立した無料枠です。Workspace の Gemini 利用枠には影響しません。

### 手順

1. **APIキーを取得** — [Google AI Studio](https://aistudio.google.com/apikey) で発行
2. **スプレッドシートを新規作成**
3. **Apps Script エディタを開く** — `拡張機能` → `Apps Script`
4. **コードを貼り付ける**
   - `コード.gs` の中身を全削除 → `Code.gs` の内容を全てコピペ
   - `+` → `HTML` → ファイル名を `sidebar` に → `sidebar.html` の内容を全てコピペ
5. **スプレッドシートを再読み込み**（F5）
6. **メニュー `🧭 逆算AI` → `⚙️ 初期設定`** でAPIキーを設定
7. **`🧭 逆算AI` → `🚀 逆算AIを起動`** 🎉

> 📖 詳しい手順は [manual.html](manual.html) をブラウザで開いてください。

## 📁 ファイル構成

```
├── Code.gs        # GASサーバーサイド（Gemini API連携、スケジュール生成）
├── sidebar.html   # サイドバーUI（ヒアリング画面、フェーズ選択）
├── manual.html    # セットアップ＆使い方マニュアル
└── README.md      # このファイル
```

## 📚 参考理論

本ツールは以下の経営理論・フレームワークを参考にしています：

- **Five Way Positioning** — Crawford & Matthews (2001)「競争優位を実現するファイブ・ウェイ・ポジショニング戦略」
- **Brand Equity Model** — Kevin Lane Keller (1993) 情緒的価値・機能的価値・自己表現的価値
- **RsEsPs** — 電通提唱の消費者行動モデル（Recognition × Spread → Experience × Spread → Purchase × Spread）

## 🔒 データプライバシー

- Gemini API **無料枠**を使用しています
- 無料枠ではGoogleの製品改善に入力データが使用される場合があります（アカウント紐付けは解除）
- 不正利用監視ログはモデル学習には使用されません
- **推奨：** パスワードや機密情報は入力しないでください

詳細は [Gemini API利用規約](https://ai.google.dev/gemini-api/terms) を参照してください。

## 🏢 開発

**AOB Consulting** — IT × 教育で企業の人材育成を支援

- 🌐 [aobconsulting.co.jp](https://aobconsulting.co.jp)
- 📧 業務カスタマイズ・T型人材育成のご相談はお気軽にどうぞ

## 📄 License

MIT License — 自由に使用・改変・再配布できます。
