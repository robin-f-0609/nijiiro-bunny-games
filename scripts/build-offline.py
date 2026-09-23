"""Build a self-contained reading copy. No network or third-party packages."""
from pathlib import Path
import base64
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
game = root / 'fujita-earth-trip'
target = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist' / 'fujita-white-page.html'
assets = {p.stem: 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode() for p in (game / 'assets').glob('*.webp')}
story = (game / 'story.js').read_text().replace('export ', '')
engine = (game / 'app.js').read_text().split('\n', 1)[1]
engine = engine.replace('`./assets/${name}.webp`', 'offlineAssets[name]')
engine = engine.replace("shelf.href = '../'", "shelf.href = '#bookshelf'")
html = (game / 'index.html').read_text().replace('href="../"', 'href="#bookshelf"')
css = (game / 'style.css').read_text()
css += '''
#offline-shelf{max-width:640px;margin:0 auto;min-height:100dvh;padding:44px 28px;background:var(--paper);line-height:1.9}
#offline-shelf .logo{width:220px;max-width:90%;height:auto;mix-blend-mode:multiply}
#offline-shelf h1,#offline-shelf h2{font-family:'Hiragino Mincho ProN','Yu Mincho',serif;font-weight:500;letter-spacing:.08em}
#offline-shelf h1{font-size:28px;margin:32px 0 24px}#offline-shelf h2{font-size:22px;margin:18px 0}
#offline-shelf p{font-size:14px;color:var(--muted)}#offline-shelf .shelf-book{display:block;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:26px 0;margin-top:30px}
#offline-shelf .shelf-book img{float:right;width:110px;height:110px;mix-blend-mode:multiply}
#offline-shelf .next{display:inline-block;margin-top:12px}
'''
html = re.sub(r'<link rel="stylesheet"[^>]*>', '<style>' + css + '</style>', html)
html = re.sub(r'<script type="module"[^>]*></script>', '', html)
shelf = f'''<section id="offline-shelf" hidden aria-label="おはなしのほんだな">
<img class="logo" src="{assets['logo']}" alt="にじいろばにー"><h1>おはなしの<br>ほんだな</h1>
<p>読んで、想像して、ときどき手伝って。<br>きみと一緒に、すすむお話。</p>
<a class="shelf-book" href="#read"><img src="{assets['book']}" alt="ひらいた本"><p>『わくわくロケット』 はじまりのものがたり</p><h2>ふじた地球旅行記<br>さいごの、しろいページ</h2><p>海、森、雨、そして空いっぱいの虹。<br>旅のページを、一緒に書いてみませんか。</p><span class="next">本をひらく　›</span></a>
<p>親子で読み聞かせても、ひとりで読んでも。<br>音を出さなくても遊べます。</p></section>'''
navigation = '''
document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  if (link.getAttribute('href') === '#bookshelf') {
    event.preventDefault(); stopSounds(); document.getElementById('reader').hidden = true;
    document.getElementById('offline-shelf').hidden = false; window.scrollTo(0,0);
  } else if (link.getAttribute('href') === '#read') {
    event.preventDefault(); document.getElementById('offline-shelf').hidden = true;
    document.getElementById('reader').hidden = false; document.getElementById('reading').focus();
  }
});
'''
script = 'const offlineAssets = ' + json.dumps(assets) + ';\n' + story + '\n' + engine + '\n' + navigation
assert '</script' not in script.lower()
html = html.replace('</body>', shelf + '<script>' + script + '</script></body>')
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html, encoding='utf-8')
print(f'{target}: {target.stat().st_size} bytes')
