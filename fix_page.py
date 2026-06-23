import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the checkmark button with the trash bin
old_btn = '''<button
                              type="button"
                              onClick={() => markAsRead(message.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full  bg-[var(--subtle)] px-3 text-[11px] font-bold leading-none text-[var(--ink-primary)] transition active:scale-[0.95]"
                              aria-label={`${message.senderName} mesajını okundu olarak işaretle`}
                              title="Okundu"
                            >
                              <span className="text-[12px] leading-none">✓</span>
                              Okundu
                            </button>'''

new_btn = '''<button
                              type="button"
                              onClick={() => markAsRead(message.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FFE5E5] px-3 text-[11px] font-bold leading-none text-[#D00000] transition active:scale-[0.95] dark:bg-red-900/30 dark:text-red-500"
                              aria-label={`${message.senderName} mesajını okundu olarak işaretle`}
                              title="Sil"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                              Sil
                            </button>'''

content = content.replace(old_btn, new_btn)

# Add Dark mode state and effect
state_old = '''  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] =
    useState<boolean | null>(null);
  const hasLoadedStorage = useRef(false);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);'''

state_new = '''  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] =
    useState<boolean | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const hasLoadedStorage = useRef(false);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tekpanel:theme");
      if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
        window.setTimeout(() => setIsDarkMode(true), 0);
      }
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tekpanel:theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tekpanel:theme", "light");
      }
      return next;
    });
  }, []);'''

content = content.replace(state_old, state_new)

# Add Dark mode toggle button to header
header_old = '''<div className="flex flex-col items-center">
              <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-[var(--accent-bg)] px-3 text-[18px] font-black text-[var(--accent-fg)]">
                <span className="mono">
                  {visibleMessages.length === 0 ? "0" : visibleMessages.length}
                </span>
              </div>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                mesaj
              </span>
            </div>'''

header_new = '''<div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-[var(--ink-secondary)] ring-1 ring-[var(--border-soft)] transition active:scale-95"
                aria-label={isDarkMode ? "Aydınlık Tema" : "Karanlık Tema"}
              >
                {isDarkMode ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <div className="flex flex-col items-center">
                <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-[var(--accent-bg)] px-3 text-[18px] font-black text-[var(--accent-fg)]">
                  <span className="mono">
                    {visibleMessages.length === 0 ? "0" : visibleMessages.length}
                  </span>
                </div>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  mesaj
                </span>
              </div>
            </div>'''

content = content.replace(header_old, header_new)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patching successful.")
