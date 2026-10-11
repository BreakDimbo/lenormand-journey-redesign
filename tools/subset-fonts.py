"""Regenerate fonts/ + fonts.css when new Chinese text is added. Run from site/: python3 tools/subset-fonts.py
Chunk 0 = characters used by the UI (app/ov/html/css/phrases), later chunks = card data/story text by frequency.
Uses the Google Fonts `text=` subsetting API; output is self-hosted woff2 with exact unicode-range per chunk."""
import urllib.request,urllib.parse,re,glob,os
from collections import Counter
rd=lambda fs:''.join(open(f,encoding='utf8').read() for f in fs if os.path.exists(f))
ui=rd(['app.js','ov.js','index.html','style.css','ov.css','phrases.js']);al=ui+rd(['data.js','story.js','clean.js'])
cu=Counter(c for c in ui if ord(c)>0x2000);ca=Counter(c for c in al if ord(c)>0x2000)
c0=sorted(cu,key=lambda c:-cu[c]);rest=sorted([c for c in ca if c not in cu],key=lambda c:-ca[c])
chunks=[c0[i:i+450] for i in range(0,len(c0),450)]+[rest[i:i+450] for i in range(0,len(rest),450)]
A=''.join(chr(i) for i in range(32,127));UA={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'}
def rng(t):
  cps=sorted(set(map(ord,t)));r=[];s=p=cps[0]
  for c in cps[1:]:
    if c==p+1:p=c;continue
    r.append((s,p));s=p=c
  r.append((s,p));return ','.join(f'U+{a:X}' if a==b else f'U+{a:X}-{b:X}' for a,b in r)
css=[l for l in open('fonts.css').read().split('\n') if 'Cormorant' in l]
for fam,ws,key in [('Noto Serif SC',[400,500,600],'nss'),('Long Cang',[400],'lc'),('Ma Shan Zheng',[400],'msz')]:
  for w in ws:
    for j,ch in enumerate(chunks):
      t=''.join(ch)+(A if j==0 else '')
      c=urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?'+urllib.parse.urlencode({'family':f'{fam}:wght@{w}','text':t}),headers=UA)).read().decode()
      fn=f'{key}{w}-{j}.woff2';open('fonts/'+fn,'wb').write(urllib.request.urlopen(re.search(r'url\((.*?)\)',c).group(1)).read())
      css.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(fonts/{fn}) format('woff2');unicode-range:{rng(t)}}}")
open('fonts.css','w').write('\n'.join(css));print(len(chunks),'chunks')
