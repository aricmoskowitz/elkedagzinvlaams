import hashlib, json, os, sys

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

# Icons: the red pixel guild house. Rendered once with Playwright (python) and committed,
# so a normal build needs no browser. Delete a PNG to render it again.
ICONS = [('icon180.png', 180, False), ('icon192.png', 192, False), ('icon512.png', 512, False), ('icon512-maskable.png', 512, True)]
def render_icons():
    missing = [i for i in ICONS if not os.path.exists(os.path.join(D, i[0]))]
    if not missing: return
    from playwright.sync_api import sync_playwright
    exe = '/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        for name, size, mask in missing:
            pg = b.new_page(viewport={'width': size, 'height': size})
            svg = ICON_SVG.replace('width="180" height="180"', 'width="100%" height="100%"')
            # maskable: the house inside the 80% safe zone, on the sky colour
            inner = f'<div style="position:absolute;left:10%;top:10%;width:80%;height:80%">{svg}</div>' if mask else svg
            pg.set_content(f'<html><body style="margin:0;width:{size}px;height:{size}px;position:relative;background:{"linear-gradient(#A7CFF2 0 74.45%,#A9D38C 74.45% 78.9%,#DDD4C3 78.9%)" if mask else "#A7CFF2"};overflow:hidden">{inner}</body></html>')
            pg.screenshot(path=os.path.join(D, name), clip={'x': 0, 'y': 0, 'width': size, 'height': size})
            pg.close()
        b.close()
render_icons()

css = open(os.path.join(D, 'src', 'style.css')).read()
js = ''
for n in ['content', 'content2', 'content4', 'content5', 'content3', 'content6', 'content7', 'content8']:
    js += open(os.path.join(D, 'src', n + '.js')).read() + '\n'
for n in ['app1', 'app2', 'app3', 'app4', 'app8', 'app5', 'app7', 'app9', 'app10', 'app12', 'app13', 'app14', 'app15', 'app6']:
    js += open(os.path.join(D, 'src', n + '.js')).read() + '\n'

body = f'''<style>
{css}
</style>
</head>
<body>
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
{js}
</script>
</body>
</html>
'''
VERSION = hashlib.sha256(body.encode()).hexdigest()[:10]
html = f'''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Elke Dag Zin</title>
<meta name="description" content="Elke dag een beetje Vlaams: zinnen, woorden en herhalingen.">
<meta name="theme-color" content="#FFFFFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Dagzin">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icon192.png">
<link rel="apple-touch-icon" href="icon180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Work+Sans:wght@400;500;600&family=Pixelify+Sans:wght@500;700&display=swap">
<script>const APP_VERSION = "{VERSION}";</script>
''' + body

manifest = {
    'name': 'Elke Dag Zin', 'short_name': 'Dagzin', 'description': 'Elke dag een beetje Vlaams.',
    'lang': 'nl-BE', 'start_url': './', 'scope': './', 'id': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#FFFFFF', 'theme_color': '#FFFFFF',
    'icons': [
        {'src': 'icon180.png', 'sizes': '180x180', 'type': 'image/png'},
        {'src': 'icon192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icon512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icon512-maskable.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
sw = open(os.path.join(D, 'src', 'sw.js')).read().replace('__VERSION__', VERSION)

open(os.path.join(D, 'index.html'), 'w').write(html)
open(os.path.join(D, 'manifest.webmanifest'), 'w').write(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n')
open(os.path.join(D, 'sw.js'), 'w').write(sw)
print('built index.html', round(len(html.encode()) / 1024), 'KB · version', VERSION)
