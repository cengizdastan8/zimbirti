import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the button from its current location
button_pattern = r'(\s*<div className="mb-4 flex items-center gap-2">\n\s*<button\n\s*type="button"\n\s*onClick=\{\(\) => setIsChannelPanelOpen\(true\)\}\n\s*aria-label="Kanalları ayarla"\n\s*className="flex items-center gap-2 rounded-full bg-\[var\(--subtle\)\] px-3 py-1\.5 transition active:scale-95"\n\s*>\n\s*<div className="flex h-5 w-5 items-center justify-center rounded-full bg-\[var\(--ink-primary\)\] text-\[var\(--paper\)\]\">\n\s*<span className="text-\[10px\] font-black">\{enabledChannelCount\}</span>\n\s*</div>\n\s*<span className="text-\[13px\] font-black text-\[var\(--ink-primary\)\]\">Kanalları ayarla</span>\n\s*</button>\n\s*</div>)'

match = re.search(button_pattern, content)
if match:
    button_code = match.group(1)
    content = content.replace(button_code, '')
    print('Found and removed button from main')
else:
    print('Could not find button in main')
    exit(1)

# 2. Insert the button back into the header
header_target = '<div className="mx-auto flex w-full max-w-[430px] items-center justify-end px-4 py-3">'
replacement_header = '<div className="mx-auto flex w-full max-w-[430px] items-center justify-between px-4 py-3">\n          <div className="flex items-center gap-2">\n            <button\n              type="button"\n              onClick={() => setIsChannelPanelOpen(true)}\n              aria-label="Kanalları ayarla"\n              className="flex items-center gap-2 rounded-full bg-[var(--subtle)] px-3 py-1.5 transition active:scale-95"\n            >\n              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink-primary)] text-[var(--paper)]">\n                <span className="text-[10px] font-black">{enabledChannelCount}</span>\n              </div>\n              <span className="text-[13px] font-black text-[var(--ink-primary)]">Kanalları ayarla</span>\n            </button>\n          </div>'

content = content.replace(header_target, replacement_header)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
