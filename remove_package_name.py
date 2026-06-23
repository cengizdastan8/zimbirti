import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '<span className="mt-0.5 mono text-[10px] text-[var(--ink-muted)]">{channel.packageName}</span>'
content = content.replace(target, '')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
