import urllib.request
import re

with urllib.request.urlopen('http://127.0.0.1:4000/') as resp:
    html = resp.read().decode('utf-8')

print("Index HTML:", html[:200])

for match in re.finditer(r'(?:src|href)="(/assets/[^"]+)"', html):
    asset_path = match.group(1)
    url = f'http://127.0.0.1:4000{asset_path}'
    try:
        with urllib.request.urlopen(url) as aresp:
            content = aresp.read()
            print(f'Asset {asset_path} -> {aresp.status} ({len(content)} bytes)')
    except Exception as e:
        print(f'Asset {asset_path} FAILED:', e)
