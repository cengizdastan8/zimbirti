import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove "Bu ayarı açman gerekiyor" blocks completely
# We use regex to carefully match and remove them because of indentation and possible minor text changes.
btn_pattern1 = re.compile(r'\{\s*isNative\s*&&\s*!isNotificationAccessEnabled\s*\?\s*\(\s*<button.*?Bu ayar[ı\xef\xbf\xbd] a[ç\xef\xbf\xbd]man gerekiyor.*?</button>\s*\)\s*:\s*null\s*\}', re.DOTALL)

content = btn_pattern1.sub('', content)

# 2. Fix Close Button in Channel Panel
close_btn_pattern = re.compile(r'className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-\[var\(--accent-fg\)\] text-\[28px\] font-black leading-none text-\[var\(--accent-bg\)\] transition active:scale-\[0\.95\]"\s*aria-label="Kapat"')
replacement_close = 'className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[24px] font-black leading-none text-black/40 hover:bg-black/5 active:bg-black/10 transition" aria-label="Kapat"'
content = close_btn_pattern.sub(replacement_close, content)

# 3. Top right counter (remove circle and "mesaj")
# The counter currently has `<div className="flex h-11 w-11...` and a span for `mesaj`.
counter_pattern = re.compile(r'<div className="flex flex-col items-end">\s*<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-\[var\(--accent-fg\)\] text-\[var\(--accent-bg\)\]">\s*<span className="text-\[20px\] font-black tracking-tighter">\s*\{messages\.length\}\s*</span>\s*</div>\s*<span className="mt-1 text-\[9px\] font-bold uppercase tracking-\[0\.14em\] text-\[var\(--ink-muted\)\]">\s*mesaj\s*</span>\s*</div>', re.DOTALL)

replacement_counter = """<div className="flex flex-col items-end justify-center">
                <span className="text-[28px] font-black tracking-tighter text-[var(--ink-primary)]">
                  {messages.length}
                </span>
              </div>"""
content = counter_pattern.sub(replacement_counter, content)

# 4. Remove `// ` from empty state
content = content.replace('// ekran temiz.', 'Ekran temiz.')
content = content.replace('// ${sortedMessages.length} toplam mesaj var.', '${sortedMessages.length} toplam mesaj var.')

# 5. Update fallbackChannels
channels_pattern = re.compile(r'const fallbackChannels: ChannelSetting\[\] = \[(.*?)\];', re.DOTALL)
new_channels = """const fallbackChannels: ChannelSetting[] = [
  { enabled: true, installed: true, label: "WhatsApp", packageName: "com.whatsapp", sourceApp: "WhatsApp" },
  { enabled: true, installed: true, label: "WhatsApp Business", packageName: "com.whatsapp.w4b", sourceApp: "WhatsApp" },
  { enabled: true, installed: true, label: "Instagram", packageName: "com.instagram.android", sourceApp: "Instagram" },
  { enabled: true, installed: true, label: "Messenger", packageName: "com.facebook.orca", sourceApp: "Facebook" },
  { enabled: true, installed: true, label: "X (Twitter)", packageName: "com.twitter.android", sourceApp: "X / Twitter" },
  { enabled: true, installed: true, label: "Telegram", packageName: "org.telegram.messenger", sourceApp: "Telegram" },
  { enabled: true, installed: true, label: "Gmail", packageName: "com.google.android.gm", sourceApp: "E-Posta" },
  { enabled: true, installed: true, label: "Mesajlar", packageName: "com.google.android.apps.messaging", sourceApp: "SMS" },
];"""

content = channels_pattern.sub(new_channels, content)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated page.tsx with audio feedback!")
