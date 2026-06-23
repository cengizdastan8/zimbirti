import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines 738 to 813 contain the original top-level full-screen access gate.
# We will just comment them out or remove them.
# Wait, let's verify line contents first to be safe.
if "{showAccessGate ? (" in lines[737] and ") : null}" in lines[812]:
    # Delete lines 738 to 813 (index 737 to 812)
    del lines[737:813]
else:
    print("Warning: Line numbers mismatch for top access gate!")
    # Fallback to regex
    content = "".join(lines)
    content = re.sub(r'\{\s*showAccessGate \? \(\s*<section className="fixed inset-0.*?<\/section>\s*\) : null\}', '', content, flags=re.DOTALL)
    lines = content.splitlines(True)

content = "".join(lines)

# Now, we insert the compact access gate before </main>
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
"""

content = content.replace("</main>", compact_gate + "\n    </main>")

# Address the "Kanalları ayarla" bug where it doesn't open.
# Wait, let's check if the Channel Panel is actually being rendered or if there's a typo.
# In the original file, it IS rendered: `{isChannelPanelOpen ? ( ... ) : null}`
# So it should be working! But the user said "kanalları ayarla tıklayınca bir şey olmuyor"
# This might be because the z-index is z-40, and the main section might be hiding it, OR they just had an older version installed.
# We will increase z-index of channel panel to z-50.
content = content.replace('className="ledger-panel-in fixed inset-0 z-40', 'className="ledger-panel-in fixed inset-0 z-[100]')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated page.tsx")
