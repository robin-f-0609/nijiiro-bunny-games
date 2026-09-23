# にじいろばにー おはなしのほんだな

『ふじた地球旅行記 ― さいごの、しろいページ』第8稿を、文章を中心に読む参加型デジタル絵本として実装したものです。

## 今回の実装

- 51ページ、全6経路。海・雨の選択が終盤の旅行記にも反映されます。
- 紙拾い、紙を守る、森の音、雨音、虹の観音開き、最後のページめくり。
- 添付の水彩風景5点と、指定Google Driveの本・にんじん・ロゴを採用。人物の立ち絵はありません。
- 手動ページ送り、戻る、音のオン・オフ、文字拡大、一括表示、同じブラウザでの途中再開。
- ログイン・外部CDN・ビルド・有料サービスは不要。HTML/CSS/JavaScriptだけで動きます。

## 状態

**GitHub Pagesで公開済み。** スマートフォンではファイルのプレビューではなく、下記の公開URLをブラウザで開いてください。

全6経路のDOM検証とChromiumのスマートフォン幅（390px）での51ページ踏破が合格。320px幅・横向き・拡大文字の操作も確認しています。iOS Safari／Android Chromeの実機と子どもによる試読は未確認です。詳しくは [検証結果](docs/validation.md) を参照してください。

## 開く

スマートフォンでは [おはなしのほんだな](https://robin-f-0609.github.io/nijiiro-bunny-games/) か [絵本を直接ひらく](https://robin-f-0609.github.io/nijiiro-bunny-games/fujita-earth-trip/) をブラウザで開いてください。ホーム画面に追加すると、次回からそこから開けます。

`fujita-white-page-play.html` は開発用のオフライン試遊ファイルです。スマートフォンのファイルプレビューではJavaScriptが動作しない場合があるため、スマートフォンへの配布には上記のHTTPSリンクを使ってください。

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

GitHub Actionsでは公開時にDOM検証とブラウザ検証を実行します。

## GitHubへの反映

対象は `robin-f-0609/nijiiro-bunny-games` のみ。公式サイト `nijiiro-bunny-website`、Cloudflare、独自ドメインを変更しません。

旧版は `backup/before-white-page-20260923` ブランチに保存しました。ゲーム入口 `fujita-earth-trip/` は維持しています。GitHub Pagesの公開結果と自動検証結果は [検証結果](docs/validation.md) に記録しました。

`docs/assets.md` に原本の出典を記録しています。作品本文・画像を汎用OSSライセンスへ変更するものではありません。

## HTMLゲーム試作の納品ルール（スマートフォン必須）

**このリポジトリのゲーム・デジタル絵本のHTMLプロトタイプは、iPhoneのSafariなどスマートフォンのブラウザで、URLをタップするだけで操作できる状態にして納品する。** ユーザーに毎回指定してもらう必要はない。

- HTMLファイルのダウンロードリンクやChatGPT内ファイルプレビューだけでは、試作の納品完了としない。HTMLを新規の専用フォルダに設置し、GitHub PagesのHTTPS公開URLを案内する。
- プロトタイプは公開中のゲームと別URL・別フォルダに作る。ユーザーの明示的な指示がない限り、公開中の『ふじた地球旅行記』と公式サイトを上書き・変更しない。
- 表紙・裏表紙・キャラクターの指定画像はできる限り原本を使う。スマートフォンで読み込み・タップ・画面内表示ができるように調整する。
- 公開コードの反映と公開URLでの動作確認を区別する。反映待ち・端末実機未確認ならそのまま伝え、動作確認済みと断言しない。
- 初めからスマートフォンで試せるURLを回答の目立つ位置に載せる。ローカルHTMLだけを渡して「Safariで開けない場合がある」で終わらせない。

直近の表紙・裏表紙入り試作: https://robin-f-0609.github.io/nijiiro-bunny-games/prototype-first-page-covers/
