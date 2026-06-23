import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

header_regex = re.compile(
    r'(<header className="sticky top-0 z-30 bg-\[var\(--paper\)\]/90 backdrop-blur-xl border-b border-\[var\(--border-soft\)\]">).*?(</header>)',
    re.DOTALL
)

new_header = """<header className="sticky top-0 z-30 bg-[var(--paper)]/90 backdrop-blur-xl border-b border-[var(--border-soft)] flex flex-col gap-3 pb-4">
        {/* Top row: Title + Actions */}
        <div className="mx-auto flex w-full max-w-[430px] items-center justify-between px-4 pt-4">
          <h1 className="text-[24px] font-black tracking-tight text-[var(--ink-primary)]">Gelen mesajlar</h1>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--subtle)] text-[var(--ink-primary)] transition active:scale-95"
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
            <button
              type="button"
              onClick={() => void clearScreen()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--subtle)] text-[var(--ink-primary)] transition active:scale-95"
              aria-label="Ayarlar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Second row: Tabs */}
        <div className="mx-auto w-full max-w-[430px] px-4">
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
            <button
              type="button"
              onClick={() => setSelectedChannelPackage("all")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition ${selectedChannelPackage === "all" ? "bg-[var(--ink-primary)] text-[var(--paper)]" : "bg-[var(--subtle)] text-[var(--ink-secondary)]"}`}
            >
              Tüm mesajlar<span className="sr-only">Tümü</span>
            </button>
            {enabledChannels.map((channel) => {
              const theme = sourceThemeFor(channel.sourceApp);
              const isSelected = selectedChannelPackage === channel.packageName;
              return (
                <button
                  key={channel.packageName}
                  type="button"
                  onClick={() => setSelectedChannelPackage(channel.packageName)}
                  aria-label={channel.label}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold transition ${isSelected ? theme.badgeClass : "bg-[var(--subtle)] text-[var(--ink-secondary)]"}`}
                >
                  <BrandIcon icon={theme.icon} label={theme.label} className="h-3 w-3" />
                  <span>{channel.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Third row: Kanalları ayarla */}
        <div className="mx-auto w-full max-w-[430px] px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChannelPanelOpen(true)}
              aria-label="Kanalları ayarla"
              className="flex items-center gap-2 rounded-full bg-[var(--subtle)] px-3 py-1.5 transition active:scale-95"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink-primary)] text-[var(--paper)]">
                <span className="text-[10px] font-black">{enabledChannelCount}</span>
              </div>
              <span className="text-[13px] font-black text-[var(--ink-primary)]">Kanalları ayarla</span>
            </button>
          </div>
        </div>
      </header>"""

if header_regex.search(content):
    content = header_regex.sub(new_header, content)
    with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Header successfully updated.")
else:
    print("Header regex did not match.")
