import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract the button and remove from header
button_pattern = r'(\s*<div className="flex items-center gap-2">\n\s*<button\n\s*type="button"\n\s*onClick=\{\(\) => setIsChannelPanelOpen\(true\)\}\n\s*aria-label="Kanalları ayarla"\n\s*className="flex items-center gap-2 rounded-full bg-\[var\(--subtle\)\] px-3 py-1\.5 transition active:scale-95"\n\s*>\n\s*<div className="flex h-5 w-5 items-center justify-center rounded-full bg-\[var\(--ink-primary\)\] text-\[var\(--paper\)\]">\n\s*<span className="text-\[10px\] font-black">\{enabledChannelCount\}</span>\n\s*</div>\n\s*<span className="text-\[13px\] font-black text-\[var\(--ink-primary\)\]\">Kanalları ayarla</span>\n\s*</button>\n\s*</div>)'

match = re.search(button_pattern, content)
if not match:
    print('Could not find button to extract')
    exit(1)

button_code = match.group(1)
content = content.replace(button_code, '')

# 2. Change justify-between to justify-end in the header
content = content.replace('className="mx-auto flex w-full max-w-[430px] items-center justify-between px-4 py-3"', 'className="mx-auto flex w-full max-w-[430px] items-center justify-end px-4 py-3"')

# 3. Insert the button above the message count
insert_target = '        {selectedChannel && ('
new_button_code = button_code.replace('<div className="flex items-center gap-2">', '<div className="mb-4 flex items-center gap-2">')

if insert_target in content:
    content = content.replace(insert_target, new_button_code + '\n\n' + insert_target)
else:
    print('Could not find insert target')
    exit(1)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('UI updated successfully.')
