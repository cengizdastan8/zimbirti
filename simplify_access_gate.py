import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the entire showAccessGate block
pattern = re.compile(r'\{\/\* Access Gate Modal \*\/}.*?\}\)\}', re.DOTALL)

replacement = """{/* Notification Gate */}
        {showAccessGate && (
          <div className="mx-auto w-full max-w-[430px] px-4 pt-4">
            <div className="mb-4 rounded-3xl bg-[#FFF5F5] p-5 dark:bg-red-950/20">
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
                    Mesajların panele düşmesi için bildirime erişim izni gerekir. TekPanel internet izni istemez; mesajlar bu telefonda kalır.
                  </p>
                  <button
                    type="button"
                    onClick={() => void openNotificationAccess()}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-primary)] px-4 py-2 text-[12px] font-bold text-[var(--paper)] transition active:scale-95"
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
        )}"""

if pattern.search(content):
    content = pattern.sub(replacement, content)
    with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced access gate successfully.")
else:
    print("Could not find the access gate block.")
