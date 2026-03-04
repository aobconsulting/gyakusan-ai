# 🧭 逆算AI — ゴール逆算型タスクスケジューラー

> 「何から始めればいいか分からない」を解消する、AIスケジュール生成ツール

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![GAS](https://img.shields.io/badge/Google%20Apps%20Script-✓-blue.svg)](https://script.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini%20API-2.5%20flash-brightgreen.svg)](https://aistudio.google.com/)

## ✨ 特徴

- **AIヒアリング** — 「そもそも何のため？」を引き出し、本当のゴールを明確化
- **逆算スケジュール生成** — ゴール日から逆算したマイルストーンを自動生成
- **プレビュー＆編集** — 生成されたスケジュールを確認し、日付・時間の変更やタスク削除が可能
- **保存先選択** — スプレッドシート / Googleカレンダー / 両方から選べる
- **スケジュール履歴保存** — 生成するたびにシートが残る（上書きなし）
- **組織対応** — 複数人で使うとユーザー名が自動付与
- **具体⇔抽象トレーニング** — 使うだけで思考の解像度が上がる
- **仕事・事業・プライベート全対応** — 上司の指示も起業も結婚式の準備も

## 🚀 セットアップ

### 必要なもの

- Google アカウント（Workspace 推奨）
- Gemini API キー（[Google AI Studio](https://aistudio.google.com/apikey) で無料取得）

### 手順

1. **Gemini API キーを取得**  
   [Google AI Studio](https://aistudio.google.com/apikey) にアクセス → APIキーをコピー

2. **スプレッドシートを新規作成**  
   Google ドライブで「新規」→「Google スプレッドシート」

3. **Apps Script エディタを開く**  
   「拡張機能」→「Apps Script」

4. **コードを貼り付ける**  
   - `コード.gs` の中身を全削除 → `Code.gs` の内容を全てコピペ  
   - 左の「＋」→「HTML」→ ファイル名を `ui` に変更 → `ui.html` の内容を全てコピペ
   - `manual.html` も同じ要領で追加（ファイル名は `manual`）

5. **APIキーをスクリプトプロパティに設定**  
   「プロジェクトの設定（⚙️）」→「スクリプトプロパティ」→「スクリプトプロパティを追加（または編集）」  
   プロパティ名：`GEMINI_API_KEY` / 値：取得したAPIキー

6. **スプレッドシートを再読み込み**（F5）

7. **メニュー「🧭 逆算AI」→「🚀 逆算AIを起動」** 🎉

> 📖 詳しい手順・図解つきは **manual.html** をご覧ください。
> 開き方：このリポジトリの `manual.html` をクリック → ファイル上部の **「Raw」ボタン** をクリック → ブラウザにHTMLマニュアルが表示されます。
> またはリポジトリをダウンロード/クローンして、`manual.html` をブラウザで直接開いてもOKです。

## 📁 ファイル構成

```
├── Code.gs        # GASサーバーサイド（Gemini API連携、スケジュール生成）
├── ui.html        # ウェブアプリUI（ヒアリング画面、フェーズ選択、使い方ガイド内蔵）
├── manual.html    # セットアップ＆使い方マニュアル（図解付き、アプリ内から閲覧可）
└── README.md      # このファイル
```

## 📚 参考理論

本ツールは以下の経営理論・フレームワークを参考にしています：

- **Five Way Positioning** — Crawford & Matthews (2001)
- **Brand Equity Model** — Kevin Lane Keller (1993)
- **RsEsPs** — 電通提唱の消費者行動モデル

## 🔒 データプライバシー

- Gemini API **無料枠**を使用しています
- 無料枠ではGoogleの製品改善に入力データが使用される場合があります（アカウント紐付けは解除）
- **推奨：** パスワードや機密情報は入力しないでください

詳細は [Gemini API利用規約](https://ai.google.dev/gemini-api/terms) を参照してください。

## 🏢 開発

**AOB Consulting** — IT × 教育で企業の人材育成を支援

- 🌐 [aobconsulting.co.jp](https://aobconsulting.co.jp)
- 御社の業務に合わせたカスタマイズや、**Claude Code × GASでツールを作れるT型人材の育成**もご支援しています。お気軽にご相談ください。

## 📄 License

MIT License — 自由に使用・改変・再配布できます。
