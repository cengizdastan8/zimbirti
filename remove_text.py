import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\{selectedChannel && \(\s*<p className="mb-4 mono text-\[11px\] font-bold tracking-widest text-\[var\(--ink-muted\)\]">\n\s*\{selectedChannel\.label\}: \{visibleMessages\.length\} mesaj görünüyor\n\s*</p>\n\s*\)\}\n\s*', '', content)

content = re.sub(r'\{!selectedChannel && visibleMessages\.length > 0 && \(\s*<p className="mb-4 mono text-\[11px\] font-bold tracking-widest text-\[var\(--ink-muted\)\]">\n\s*\{visibleMessages\.length\} mesaj yakalandı\n\s*</p>\n\s*\)\}\n\s*', '', content)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
