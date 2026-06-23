import re

with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_match = re.search(r"  return \(\n    <main", content)
if not start_match:
    print("Could not find start")
    exit(1)

start_idx = start_match.start()

new_ui = """  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--ink-primary)] pb-safe relative font-sans">
      {/* Access Gate Modal */}
      {showAccessGate && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] p-6 pt-16">
          <div className="mx-auto w-full max-w-[430px] flex-1 flex flex-col">
            <span className="mono text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              TekPanel
            </span>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-[var(--ink-primary)]">
              İzin Gerekli.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              Mesajları yakalayabilmemiz için bildirim okuma izni vermeniz gerekiyor.
            </p>
            
            <ol className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--subtle)] text-[12px] font-black text-[var(--ink-primary)] ring-1 ring-[var(--border-strong)]">
                  1
                </span>
                <span className="text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  Aşağıdaki butona bas. Telefonun bildirim izni ekranı açılacak.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--subtle)] text-[12px] font-black text-[var(--ink-primary)] ring-1 ring-[var(--border-strong)]">
                  2
                </span>
                <span className="text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  Listeden <span className="font-black text-[var(--ink-primary)]">TekPanel</span> satırını bul, yanındaki anahtarı aç.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--subtle)] text-[12px] font-black text-[var(--ink-primary)] ring-1 ring-[var(--border-strong)]">
                  3
                </span>
                <span className="text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  Çıkan onayda <span className="font-black text-[var(--ink-primary)]">İzin ver</span> de ve geri dön. Hepsi bu.
                </span>
              </li>
            </ol>
          </div>

          <div className="mx-auto w-full max-w-[430px] pb-6">
            <button
              type="button"
              onClick={() => void openNotificationAccess()}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-[var(--ink-primary)] text-[16px] font-black text-[var(--paper)] transition active:scale-[0.98]"
            >
              Bildirim iznini aç
            </button>
            <button
              type="button"
              onClick={() => void refreshNotificationAccess()}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl text-[14px] font-bold text-[var(--ink-secondary)] transition active:scale-[0.98]"
            >
              İzni verdim, kontrol et
            </button>
          </div>
        </div>
      )}

      {/* Channel Settings Bottom Sheet */}
      {isChannelPanelOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsChannelPanelOpen(false)}>
          <div 
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] rounded-t-3xl bg-[var(--paper)] p-5 pb-safe-bottom shadow-2xl transition-transform ledger-panel-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-black tracking-tight text-[var(--ink-primary)]">Kanalları ayarla</h2>
                <p className="mt-1 text-[13px] font-semibold text-[var(--ink-secondary)]">{enabledChannelCount} kanal açık</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChannelPanelOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--subtle)] text-[var(--ink-primary)] transition active:scale-95"
                aria-label="Menüyü gizle"
              >
                ×
              </button>
            </div>

            {channels.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-[var(--ink-secondary)]">
                Bu telefonda mesaj kanalı bulunamadı.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void toggleAllChannels()}
                  className="flex items-center justify-between rounded-2xl bg-[var(--subtle)] p-4 transition active:scale-[0.99]"
                  aria-label="Tümünü aç"
                  aria-pressed={areAllChannelsEnabled}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[15px] font-black text-[var(--ink-primary)]">Tümünü aç</span>
                    <span className="mt-0.5 text-[12px] font-semibold text-[var(--ink-muted)]">Tüm kaynakları seç</span>
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${areAllChannelsEnabled ? 'border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--paper)]' : 'border-[var(--border-strong)] bg-transparent'}`}>
                    {areAllChannelsEnabled && <span className="text-[14px] font-black leading-none">✓</span>}
                  </div>
                </button>

                <div className="mt-2 flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                  {channels.map((channel) => {
                    const theme = sourceThemeFor(channel.sourceApp);
                    return (
                      <button
                        key={channel.packageName}
                        type="button"
                        onClick={() => void toggleChannel(channel.packageName)}
                        className={`flex items-center justify-between rounded-2xl border p-4 transition active:scale-[0.99] ${channel.enabled ? 'border-[var(--border-strong)] bg-[var(--card)] shadow-sm' : 'border-transparent bg-[var(--subtle)] opacity-70'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${theme.accentClass}`}>
                            <BrandIcon icon={theme.icon} label={theme.label} className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-[15px] font-bold text-[var(--ink-primary)]">{channel.label}</span>
                            <span className="mt-0.5 mono text-[10px] text-[var(--ink-muted)]">{channel.packageName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-[12px] font-black ${channel.enabled ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-muted)]'}`}>
                            {channel.enabled ? 'Açık' : 'Kapalı'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[var(--paper)]/90 backdrop-blur-xl border-b border-[var(--border-soft)]">
        <div className="mx-auto flex w-full max-w-[430px] items-center justify-between px-4 py-3">
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
              <span className="text-[13px] font-black text-[var(--ink-primary)]">Kanal</span>
            </button>
          </div>
          
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
              onClick={() => void clearMessages()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--subtle)] text-[var(--ink-primary)] transition active:scale-95"
              aria-label="Ayarlar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Sub Header for Page Title & Filters */}
        <div className="mx-auto w-full max-w-[430px] px-4 pb-3">
          <h1 className="text-[24px] font-black tracking-tight text-[var(--ink-primary)]">Gelen mesajlar</h1>
          
          <div className="mt-3 flex overflow-x-auto no-scrollbar gap-2 pb-1">
            <button
              type="button"
              onClick={() => setSelectedChannelPackage("all")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition ${selectedChannelPackage === "all" ? "bg-[var(--ink-primary)] text-[var(--paper)]" : "bg-[var(--subtle)] text-[var(--ink-secondary)]"}`}
            >
              Tüm mesajlar
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
      </header>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[430px] p-4">
        {selectedChannel && (
          <p className="mb-4 mono text-[11px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
            {selectedChannel.label}: {visibleMessages.length} mesaj görünüyor
          </p>
        )}
        
        {!selectedChannel && visibleMessages.length > 0 && (
          <p className="mb-4 mono text-[11px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
            {visibleMessages.length} mesaj yakalandı
          </p>
        )}

        {visibleMessages.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--subtle)] text-[var(--ink-muted)]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="mt-5 text-[17px] font-black text-[var(--ink-primary)]">Mesaj bildirimi bekleniyor</h3>
            <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-[var(--ink-secondary)]">
              Yeni mesajlar düştüğünde burada görünecek.
            </p>
            {selectedChannel && (
              <button
                type="button"
                onClick={() => setSelectedChannelPackage("all")}
                className="mt-6 rounded-xl bg-[var(--ink-primary)] px-5 py-2.5 text-[14px] font-bold text-[var(--paper)] transition active:scale-95"
              >
                Tümü
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleMessages.map((message) => {
              const theme = sourceThemeFor(message.sourceApp);
              const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });
              const messageDate = new Date(message.receivedAt);
              const diffInMinutes = Math.round((messageDate.getTime() - Date.now()) / 60000);
              
              let timeText = "";
              if (Math.abs(diffInMinutes) < 60) {
                timeText = rtf.format(diffInMinutes, "minute");
              } else if (Math.abs(diffInMinutes) < 1440) {
                timeText = rtf.format(Math.round(diffInMinutes / 60), "hour");
              } else {
                timeText = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(messageDate);
              }

              return (
                <div key={message.id} className="ledger-row-in group relative overflow-hidden rounded-2xl bg-[var(--card)] p-4 shadow-sm ring-1 ring-[var(--border-strong)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white ${theme.accentClass}`}>
                        <BrandIcon icon={theme.icon} label={theme.label} className="h-3 w-3" />
                      </div>
                      <span className="text-[15px] font-black text-[var(--ink-primary)] line-clamp-1">
                        {message.senderName}
                      </span>
                    </div>
                    <span className="shrink-0 text-[12px] font-bold text-[var(--ink-muted)]">
                      {timeText}
                    </span>
                  </div>
                  
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
                    {message.messageText}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {message.captureMethod !== "notification" && (
                        <span className="mono rounded bg-[var(--subtle)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--ink-muted)]">
                          {message.captureMethod === "share" ? "PAYLAŞIM" : message.captureMethod}
                        </span>
                      )}
                      {message.sourcePackage && (
                        <span className="mono rounded bg-[var(--subtle)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--ink-faint)] truncate max-w-[120px]">
                          {message.sourcePackage}
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => markAsRead(message.id)}
                      aria-label="Sil"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 active:scale-95 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
"""

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content[:start_idx] + new_ui)

print("UI successfully replaced.")
