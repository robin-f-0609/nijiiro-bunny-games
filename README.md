# にじいろばにー ゲーム
ゲーム専用のPublicリポジトリです。公式Webサイトは別リポジトリ `nijiiro-bunny-website` とCloudflare Pagesで管理しています。

## 公開URL
- ゲーム一覧: https://robin-f-0609.github.io/nijiiro-bunny-games/
- ふじた地球旅行記: https://robin-f-0609.github.io/nijiiro-bunny-games/fujita-earth-trip/
- にじいろレスキュー: https://robin-f-0609.github.io/nijiiro-bunny-games/nijiiro-rescue/

## 構成
- `index.html`: ゲーム一覧
- `fujita-earth-trip/index.html`: ふじた地球旅行記
- `nijiiro-rescue/index.html`: にじいろレスキュー
- `assets/`: 今後の共通素材用（現在の画像は各ゲーム内に埋め込み）
- `nijiiro-bunny-mvp.html`: 旧ファイル名からの転送
- `.nojekyll`: HTMLをそのまま公開

## 公開設定
GitHub Pagesで `main` ブランチの `/ (root)` を公開します。独自ドメインや有料サービスは使用しません。
新しいゲームは専用フォルダに `index.html` を追加し、ルートのゲーム一覧から相対リンクを張ります。

## 移行元
`robin-f-0609/nijiirobunny.github.io` の2作品を移行。ゲーム本体のコードは維持しています。旧リポジトリは新URLへの転送専用とし、移行前のコードは旧リポジトリのGit履歴に残します。

