import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the huge Notification Gate from the top:
huge_gate_pattern = re.compile(r'\{\s*showAccessGate\s*\?\s*\(\s*<section.*?İzin ekranını aç.*?</section>\s*\)\s*:\s*null\s*\}', re.DOTALL)
content = huge_gate_pattern.sub('', content)

# 2. Add the compact Notification Gate at the very bottom of <main>
# We find </main>
compact_gate = """
      {/* Notification Gate */}
      {showAccessGate && (
        <div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-safe relative z-50">
          <div className="rounded-3xl bg-[#FFF5F5] p-5 shadow-lg border border-red-100 dark:bg-red-950/40 dark:border-red-900/50">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFE5E5] text-[#D00000] dark:bg-red-900/40 dark:text-red-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 pt-1">
                <h2 className="text-[15px] font-black tracking-tight text-[var(--ink-primary)]">
                  Bildirim izni kapalı
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-[var(--ink-secondary)]">
                  Mesajların buraya düşmesi için bildirime erişim izni gerekir. 
                </p>
                <button
                  type="button"
                  onClick={() => void openNotificationAccess()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-primary)] px-4 py-2 text-[12px] font-bold text-[var(--paper)] transition active:scale-95 shadow-sm"
                >
                  İzni Aç
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>"""
content = content.replace('</main>', compact_gate)

# 3. Fix the counter (remove circle and "mesaj")
counter_old = """              <div className="flex flex-col items-end">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-fg)] text-[var(--accent-bg)]">
                  <span className="text-[20px] font-black tracking-tighter">
                    {messages.length}
                  </span>
                </div>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  mesaj
                </span>
              </div>"""
counter_new = """              <div className="flex flex-col items-end justify-center">
                <span className="text-[28px] font-black tracking-tighter text-[var(--ink-primary)]">
                  {messages.length}
                </span>
              </div>"""
content = content.replace(counter_old, counter_new)

# 4. Remove `Bu ayarı açman gerekiyor` blocks
bu_ayar_pattern = re.compile(r'\{\s*isNative\s*&&\s*!isNotificationAccessEnabled\s*\?\s*\(\s*<button.*?Bu ayar.*?man gerekiyor.*?</button>\s*\)\s*:\s*null\s*\}', re.DOTALL)
content = bu_ayar_pattern.sub('', content)

# 5. Fix Close Button in Channel Panel
close_old = """className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-fg)] text-[28px] font-black leading-none text-[var(--accent-bg)] transition active:scale-[0.95]"
              aria-label="Kapat\""""
close_new = """className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[24px] font-black leading-none text-black/40 hover:bg-black/5 active:bg-black/10 transition" aria-label="Kapat\""""
content = content.replace(close_old, close_new)

# 6. Fix `// ekran temiz`
content = content.replace('// ekran temiz.', 'Ekran temiz.')
content = content.replace('// ${sortedMessages.length} toplam mesaj var.', '${sortedMessages.length} toplam mesaj var.')

# 7. Update fallbackChannels
channels_old_pattern = re.compile(r'const fallbackChannels: ChannelSetting\[\] = \[(.*?)\];', re.DOTALL)
channels_new = """const fallbackChannels: ChannelSetting[] = [
  { enabled: true, installed: true, label: "WhatsApp", packageName: "com.whatsapp", sourceApp: "WhatsApp" },
  { enabled: true, installed: true, label: "WhatsApp Business", packageName: "com.whatsapp.w4b", sourceApp: "WhatsApp" },
  { enabled: true, installed: true, label: "Instagram", packageName: "com.instagram.android", sourceApp: "Instagram" },
  { enabled: true, installed: true, label: "Messenger", packageName: "com.facebook.orca", sourceApp: "Facebook" },
  { enabled: true, installed: true, label: "X (Twitter)", packageName: "com.twitter.android", sourceApp: "X / Twitter" },
  { enabled: true, installed: true, label: "Telegram", packageName: "org.telegram.messenger", sourceApp: "Diger" },
  { enabled: true, installed: true, label: "Gmail", packageName: "com.google.android.gm", sourceApp: "Diger" },
  { enabled: true, installed: true, label: "Mesajlar", packageName: "com.google.android.apps.messaging", sourceApp: "SMS" },
];"""
content = channels_old_pattern.sub(channels_new, content)

# Fix Channel panel z-index to show over header
content = content.replace('className="ledger-panel-in fixed inset-0 z-40', 'className="ledger-panel-in fixed inset-0 z-[100]')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored UI and applied user feedback.")
