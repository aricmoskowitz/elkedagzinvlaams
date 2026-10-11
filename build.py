import base64, os, sys
from playwright.sync_api import sync_playwright

D = os.path.dirname(os.path.abspath(__file__))
ICON_SVG = '''<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="180" height="180" shape-rendering="crispEdges">
<rect width="36" height="36" fill="#A7CFF2"/><rect y="29" width="36" height="7" fill="#A9D38C"/><rect y="31" width="36" height="5" fill="#DDD4C3"/>
<rect x="2" y="32" width="2" height="2" fill="#C9BEA9"/><rect x="8" y="34" width="2" height="2" fill="#C9BEA9"/><rect x="28" y="33" width="2" height="2" fill="#C9BEA9"/><rect x="32" y="31" width="2" height="2" fill="#C9BEA9"/>
<rect x="3" y="6" width="5" height="2" fill="#fff"/><rect x="2" y="7" width="8" height="2" fill="#fff"/><rect x="27" y="10" width="6" height="2" fill="#fff"/><rect x="26" y="11" width="8" height="2" fill="#fff"/>
<rect x="7" y="13" width="22" height="19" fill="#2A2620"/><rect x="9" y="10" width="18" height="6" fill="#2A2620"/><rect x="12" y="7" width="12" height="6" fill="#2A2620"/><rect x="15" y="4" width="6" height="6" fill="#2A2620"/><rect x="8" y="14" width="20" height="17" fill="#C8553D"/><rect x="10" y="11" width="16" height="4" fill="#C8553D"/><rect x="13" y="8" width="10" height="4" fill="#C8553D"/><rect x="16" y="5" width="4" height="4" fill="#C8553D"/>
<rect x="17" y="2" width="2" height="2" fill="#F2D35B"/><rect x="16" y="1" width="4" height="1" fill="#2A2620" opacity="0"/>
<rect x="16" y="9" width="4" height="3" fill="#F4EFE4"/>
<rect x="11" y="16" width="4" height="4" fill="#F4EFE4"/><rect x="21" y="16" width="4" height="4" fill="#F4EFE4"/>
<rect x="11" y="23" width="4" height="4" fill="#F4EFE4"/><rect x="21" y="23" width="4" height="4" fill="#F4EFE4"/>
<rect x="16" y="23" width="4" height="8" fill="#2A2620"/><rect x="8" y="14" width="20" height="1" fill="#A8432F"/>
</svg>'''

png_path = os.path.join(D, 'icon180.png')
if not os.path.exists(png_path):
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 180, 'height': 180})
        pg.set_content('<html><body style="margin:0">' + ICON_SVG + '</body></html>')
        pg.screenshot(path=png_path, clip={'x': 0, 'y': 0, 'width': 180, 'height': 180})
        b.close()
icon_b64 = 'data:image/png;base64,' + base64.b64encode(open(png_path, 'rb').read()).decode()

css = open(os.path.join(D, 'src', 'style.css')).read()
js = open(os.path.join(D, 'src', 'content.js')).read() + '\n' + open(os.path.join(D, 'src', 'content2.js')).read() + '\n' + open(os.path.join(D, 'src', 'content4.js')).read() + '\n' + open(os.path.join(D, 'src', 'content5.js')).read() + '\n' + open(os.path.join(D, 'src', 'content3.js')).read() + '\n'
for n in ['app1', 'app2', 'app3', 'app4', 'app8', 'app5', 'app7', 'app9', 'app10', 'app12', 'app13', 'app6']:
    js += open(os.path.join(D, 'src', n + '.js')).read() + '\n'

html = f'''<title>Elke Dag Zin</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Dagzin">
<meta name="theme-color" content="#FFFFFF">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Work+Sans:wght@400;500;600&family=Pixelify+Sans:wght@500;700&display=swap">
<style>
{css}
</style>
<div id="app">
  <main id="main" aria-live="polite"></main>
  <nav id="tabs" role="tablist" aria-label="Hoofdmenu">
    <button data-act="tab" data-tab="pad" role="tab" data-en="Path (map)">Pad</button>
    <button data-act="tab" data-tab="woorden" role="tab" data-en="Words">Woorden</button>
    <button data-act="tab" data-tab="naslag" role="tab" data-en="Reference">Naslag</button>
    <button data-act="tab" data-tab="ik" role="tab" data-en="Me">Ik</button>
  </nav>
</div>
<script>
const ICON_PNG = "{icon_b64}";
{js}
</script>
'''
out = os.path.join(D, 'index.html')
open(out, 'w').write(html)
print('built', out, round(len(html) / 1024), 'KB')
