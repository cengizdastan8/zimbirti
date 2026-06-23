import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract and remove the Notification Gate
notification_gate_pattern = re.compile(r'(\s*\{\/\* Notification Gate \*\/}.*?\)\})', re.DOTALL)
match = notification_gate_pattern.search(content)

if not match:
    print("Notification gate not found")
    exit(1)

notification_gate_text = match.group(1)

# Remove the notification gate from its current position
content = content.replace(notification_gate_text, '')

# 2. Re-insert Notification Gate at the bottom of the main tag
main_end_pattern = re.compile(r'(\s*)(\<\/main\>)')
content = main_end_pattern.sub(r'\1' + notification_gate_text.replace('\\', '\\\\') + r'\1\2', content)

# 3. Add Channel Panel
channel_panel_jsx = """
      {/* Channel Panel */}
      {isChannelPanelOpen ? (
        <section className="fixed inset-0 z-50 mx-auto flex w-full max-w-[390px] flex-col overflow-y-auto bg-[var(--card)] px-4 pb-6 pt-16 shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:max-w-[430px]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-2 py-3">
            <h2 className="text-[21px] font-black tracking-[-0.03em] text-[var(--ink-primary)]">
              Kanalları ayarla
            </h2>
            <button
              type="button"
              onClick={() => setIsChannelPanelOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--subtle)] text-[18px] font-black leading-none text-[var(--ink-primary)] transition active:scale-[0.95]"
              aria-label="Kapat"
            >
              &times;
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            {channels.map((channel) => (
              <button
                key={channel.packageId}
                type="button"
                onClick={() => toggleChannel(channel.packageId)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--subtle)] px-4 py-4 text-left transition active:scale-[0.98]"
              >
                <div className="flex flex-col">
                  <span className="text-[15px] font-black tracking-[-0.02em] text-[var(--ink-primary)]">
                    {channel.label}
                  </span>
                </div>
                <div
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                    channel.enabled
                      ? "bg-[var(--ink-primary)]"
                      : "bg-[var(--border-strong)]"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-[var(--paper)] transition duration-200 ease-in-out ${
                      channel.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
"""

main_content_pattern = re.compile(r'(\s*\{\/\* Main Content Area \*\/})')
content = main_content_pattern.sub(channel_panel_jsx + r'\1', content)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("UI updated successfully.")
