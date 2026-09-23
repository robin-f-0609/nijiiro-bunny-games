# にじいろばにー おはなしのほんだな

『ふじた地球旅行記 ― さいごの、しろいページ』第8稿を、文章を中心に読む参加型デジタル絵本として実装したものです。

## 今回の実装

- 51ページ、全6経路。海・雨の選択が終盤の旅行記にも反映されます。
- 紙拾い、紙を守る、森の音、雨音、虹の観音開き、最後のページめくり。
- 添付の水彩風景5点と、指定Google Driveの本・にんじん・ロゴを採用。人物の立ち絵はありません。
- 手動ページ送り、戻る、音のオン・オフ、文字拡大、一括表示、同じブラウザでの途中再開。
- ログイン・外部CDN・ビルド・有料サービスは不要。HTML/CSS/JavaScriptだけで動きます。

## 状態

**ローカルで実装済み・公開未反映。** 2026-09-23、GitHubの接続アプリがブランチ作成を403で拒否したため、公開リポジトリは変更していません。

全6経路などのDOMによる機能検証は合格。ブラウザーの描画、音の実聴、スマホ実機、子どもによる試読は未確認です。詳しくは [検証結果](docs/validation.md) を参照してください。

## 開く

配布された `fujita-white-page-play.html` は画像とコードを内蔵した試遊用ファイルです。ダウンロードしてブラウザーで開けます。ファイルのプレビュー画面ではJavaScriptが動かない場合があるため、その場合は保存してブラウザーで開いてください。

ソースを開く場合は、このフォルダで次を実行します。

```sh
python -m http.server 4173
```

`http://localhost:4173/` が本棚、`http://localhost:4173/fujita-earth-trip/` が絵本です。

## 構成

- `index.html` — 本棚
- `fujita-earth-trip/index.html` / `style.css` / `app.js` / `story.js` — 画面・エンジン・全シナリオ
- `fujita-earth-trip/assets/` — 使用画像8点
- `docs/` — 共通仕様、素材台帳、実装記録、検証結果
- `tests/` — DOMイベントテストとブラウザーテスト
- `scripts/build-offline.py` — 画像内蔵の試遊版を再生成
- `nijiiro-rescue/index.html` — 公開終了したゲームから本棚への案内

## 検証を再実行する

```sh
npm install
npm run test:dom
npx playwright install chromium
# 別のターミナルで上記HTTPサーバーを起動してから
npm test
```

GitHub Actions用の設定も同梱しています。現時点では未登録・未実行です。

## GitHubへの反映

対象は `robin-f-0609/nijiiro-bunny-games` のみ。公式サイト `nijiiro-bunny-website`、Cloudflare、独自ドメインを変更しません。

既存mainを読み直し、変更がある場合は取り込んだうえで、この一式をコミットします。ゲーム入口 `fujita-earth-trip/` は維持します。GitHub Pages公開後に、表示・全6経路・音・戻る・文字拡大をブラウザーで確認してください。元のゲームはGit履歴から復元できます。

`docs/assets.md` に原本の出典を記録しています。作品本文・画像を汎用OSSライセンスへ変更するものではありません。
