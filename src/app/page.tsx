"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  siFacebook,
  siGooglemessages,
  siInstagram,
  siMessenger,
  siTiktok,
  siWhatsapp,
  siX,
  type SimpleIcon,
} from "simple-icons";

type SourceApp =
  | "WhatsApp"
  | "Instagram"
  | "Facebook"
  | "TikTok"
  | "X / Twitter"
  | "SMS"
  | "Diger";

type CaptureMethod = "manual" | "paste" | "share" | "notification";
type MessageStatus = "new" | "follow_up" | "replied" | "closed";
type Priority = "low" | "medium" | "high";

type InboxMessage = {
  id: string;
  sourceApp: SourceApp;
  sourcePackage?: string;
  senderName: string;
  messageText: string;
  receivedAt: string;
  captureMethod: CaptureMethod;
  status: MessageStatus;
  priority: Priority;
  notes: string;
  nextAction: string;
  followUpDate: string;
  customerId?: string;
};

type NativeCapturedMessage = {
  id: string;
  sourceApp: SourceApp | string;
  sourcePackage?: string;
  senderName: string;
  messageText: string;
  receivedAt: string;
  captureMethod: CaptureMethod | string;
};

type ChannelSetting = {
  label: string;
  sourceApp: SourceApp;
  packageName: string;
  installed: boolean;
  enabled: boolean;
};

type NativeInboxPlugin = {
  readCapturedMessages: () => Promise<{ messages: NativeCapturedMessage[] }>;
  clearCapturedMessages: () => Promise<void>;
  isNotificationAccessEnabled?: () => Promise<{ enabled: boolean }>;
  openNotificationAccessSettings?: () => Promise<void>;
  readChannelSettings?: () => Promise<{ channels: NativeChannelSetting[] }>;
  saveEnabledChannels?: (options: { packages: string[] }) => Promise<{
    channels: NativeChannelSetting[];
  }>;
  requestNotificationListenerRebind?: () => Promise<void>;
};

type NativeChannelSetting = {
  label?: string;
  sourceApp?: SourceApp | string;
  packageName?: string;
  installed?: boolean;
  enabled?: boolean;
};

const STORAGE_KEY = "tekpanel:phase1:messages";
const CHANNEL_STORAGE_KEY = "tekpanel:enabledChannels";
const NativeInbox = registerPlugin<NativeInboxPlugin>("TekPanelInbox");

const sourceApps: SourceApp[] = [
  "WhatsApp",
  "Instagram",
  "Facebook",
  "TikTok",
  "X / Twitter",
  "SMS",
  "Diger",
];

type SourceTheme = {
  badgeClass: string;
  borderClass: string;
  chipClass: string;
  cardClass: string;
  label: string;
  icon?: SimpleIcon;
};

const sourceThemes: Record<SourceApp, SourceTheme> = {
  WhatsApp: {
    badgeClass: "bg-[#25D366] text-white",
    borderClass: "border-emerald-300",
    chipClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cardClass: "bg-white ring-emerald-100",
    label: "WA",
    icon: siWhatsapp,
  },
  Instagram: {
    badgeClass: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
    borderClass: "border-fuchsia-300",
    chipClass: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
    cardClass: "bg-white ring-fuchsia-100",
    label: "IG",
    icon: siInstagram,
  },
  Facebook: {
    badgeClass: "bg-[#1877F2] text-white",
    borderClass: "border-blue-300",
    chipClass: "bg-blue-50 text-blue-700 ring-blue-200",
    cardClass: "bg-white ring-blue-100",
    label: "FB",
    icon: siFacebook,
  },
  TikTok: {
    badgeClass: "bg-zinc-950 text-white",
    borderClass: "border-cyan-300",
    chipClass: "bg-cyan-50 text-cyan-800 ring-cyan-200",
    cardClass: "bg-white ring-cyan-100",
    label: "TT",
    icon: siTiktok,
  },
  "X / Twitter": {
    badgeClass: "bg-zinc-950 text-white",
    borderClass: "border-zinc-300",
    chipClass: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    cardClass: "bg-white ring-zinc-200",
    label: "X",
    icon: siX,
  },
  SMS: {
    badgeClass: "bg-[#1A73E8] text-white",
    borderClass: "border-amber-300",
    chipClass: "bg-amber-50 text-amber-800 ring-amber-200",
    cardClass: "bg-white ring-amber-100",
    label: "SMS",
    icon: siGooglemessages,
  },
  Diger: {
    badgeClass: "bg-stone-700 text-white",
    borderClass: "border-stone-300",
    chipClass: "bg-stone-100 text-stone-700 ring-stone-200",
    cardClass: "bg-white ring-stone-200",
    label: "DG",
  },
};

const sourceThemeFor = (sourceApp: SourceApp) =>
  sourceThemes[sourceApp] ?? sourceThemes.Diger;

const sourceDisplayLabel = (sourceApp: SourceApp) =>
  sourceApp === "Diger" ? "Diğer" : sourceApp;

const brandIconFor = (
  sourceApp: SourceApp,
  sourcePackage?: string,
): SimpleIcon | undefined => {
  if (sourcePackage === "com.facebook.orca") {
    return siMessenger;
  }

  return sourceThemeFor(sourceApp).icon;
};

function BrandIcon({
  className = "h-4 w-4",
  icon,
  label,
}: {
  className?: string;
  icon?: SimpleIcon;
  label: string;
}) {
  if (!icon) {
    return <span className="text-[9px] font-black tracking-[0.08em]">{label}</span>;
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      role="img"
      viewBox="0 0 24 24"
    >
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

const fallbackChannels: ChannelSetting[] = [
  {
    enabled: true,
    installed: true,
    label: "WhatsApp",
    packageName: "com.whatsapp",
    sourceApp: "WhatsApp",
  },
  {
    enabled: true,
    installed: true,
    label: "WhatsApp Business",
    packageName: "com.whatsapp.w4b",
    sourceApp: "WhatsApp",
  },
  {
    enabled: true,
    installed: true,
    label: "Instagram",
    packageName: "com.instagram.android",
    sourceApp: "Instagram",
  },
  {
    enabled: true,
    installed: true,
    label: "TikTok",
    packageName: "com.zhiliaoapp.musically",
    sourceApp: "TikTok",
  },
  {
    enabled: true,
    installed: true,
    label: "X / Twitter",
    packageName: "com.twitter.android",
    sourceApp: "X / Twitter",
  },
  {
    enabled: true,
    installed: true,
    label: "Messenger",
    packageName: "com.facebook.orca",
    sourceApp: "Facebook",
  },
  {
    enabled: true,
    installed: true,
    label: "SMS",
    packageName: "com.google.android.apps.messaging",
    sourceApp: "SMS",
  },
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

const safeDateISO = (value: unknown, fallback = new Date()) => {
  const date = value ? new Date(String(value)) : fallback;
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
};

const safeDateOnly = (value: unknown) => {
  const text = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : todayISO();
};

const buildCustomerId = (sourceApp: SourceApp, senderName: string) =>
  `${sourceApp}:${senderName.trim().toLocaleLowerCase("tr-TR")}`;

const toSourceApp = (value: unknown): SourceApp => {
  const text = String(value ?? "");

  if (text === "Diger") {
    return "Diger";
  }
  if (text === "Telefon") {
    return "SMS";
  }
  if (text === "Messenger") {
    return "Facebook";
  }
  if (text === "SMS") {
    return "SMS";
  }

  return sourceApps.includes(text as SourceApp) ? (text as SourceApp) : "Diger";
};

const normalizeChannelSetting = (
  value: NativeChannelSetting,
): ChannelSetting | null => {
  const packageName = String(value.packageName ?? "").trim();
  const label = String(value.label ?? "").trim();

  if (!packageName || !label) {
    return null;
  }

  return {
    enabled: value.enabled !== false,
    installed: value.installed !== false,
    label,
    packageName,
    sourceApp: toSourceApp(value.sourceApp),
  };
};

const readStoredChannels = () => {
  try {
    const raw = localStorage.getItem(CHANNEL_STORAGE_KEY);
    const enabledPackages = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(enabledPackages)) {
      return fallbackChannels;
    }

    const enabled = new Set(enabledPackages.map((item) => String(item)));
    return fallbackChannels.map((channel) => ({
      ...channel,
      enabled: enabled.has(channel.packageName),
    }));
  } catch {
    return fallbackChannels;
  }
};

const persistStoredChannels = (channels: ChannelSetting[]) => {
  localStorage.setItem(
    CHANNEL_STORAGE_KEY,
    JSON.stringify(
      channels
        .filter((channel) => channel.enabled)
        .map((channel) => channel.packageName),
    ),
  );
};

const toCaptureMethod = (value: unknown): CaptureMethod =>
  ["manual", "paste", "share", "notification"].includes(String(value))
    ? (value as CaptureMethod)
    : "notification";

const toStatus = (value: unknown): MessageStatus =>
  ["new", "follow_up", "replied", "closed"].includes(String(value))
    ? (value as MessageStatus)
    : "new";

const toPriority = (value: unknown): Priority =>
  ["low", "medium", "high"].includes(String(value))
    ? (value as Priority)
    : "medium";

const normalizeStoredMessage = (value: unknown): InboxMessage | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<InboxMessage>;
  const sourceApp = toSourceApp(item.sourceApp);
  const senderName = String(item.senderName ?? "").trim();
  const messageText = String(item.messageText ?? "").trim();

  if (!senderName || !messageText) {
    return null;
  }

  return {
    id: String(item.id ?? createId()),
    sourceApp,
    sourcePackage: String(item.sourcePackage ?? ""),
    senderName,
    messageText,
    receivedAt: safeDateISO(item.receivedAt),
    captureMethod: toCaptureMethod(item.captureMethod),
    status: toStatus(item.status),
    priority: toPriority(item.priority),
    notes: String(item.notes ?? ""),
    nextAction: String(item.nextAction ?? "Cevap ver"),
    followUpDate: safeDateOnly(item.followUpDate),
    customerId:
      String(item.customerId ?? "").startsWith("Telefon:")
        ? buildCustomerId(sourceApp, senderName)
        : item.customerId ?? buildCustomerId(sourceApp, senderName),
  };
};

const fromNativeMessage = (message: NativeCapturedMessage): InboxMessage | null => {
  const sourceApp = toSourceApp(message.sourceApp);
  const senderName = String(message.senderName ?? "").trim() || "Yakalanan mesaj";
  const messageText = String(message.messageText ?? "").trim();

  if (!messageText) {
    return null;
  }

  return {
    id: String(message.id ?? createId()),
    sourceApp,
    sourcePackage: String(message.sourcePackage ?? ""),
    senderName,
    messageText,
    receivedAt: safeDateISO(message.receivedAt),
    captureMethod: toCaptureMethod(message.captureMethod),
    status: "new",
    priority: "medium",
    notes: "",
    nextAction: "Cevap ver",
    followUpDate: todayISO(),
    customerId: buildCustomerId(sourceApp, senderName),
  };
};

const readStoredMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeStoredMessage(item))
      .filter((message): message is InboxMessage => Boolean(message));
  } catch {
    return [];
  }
};

const sortByNewest = (messages: InboxMessage[]) =>
  [...messages].sort(
    (left, right) =>
      new Date(right.receivedAt).getTime() -
      new Date(left.receivedAt).getTime(),
  );

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
};

export default function Home() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [channels, setChannels] = useState<ChannelSetting[]>(fallbackChannels);
  const [isChannelPanelOpen, setIsChannelPanelOpen] = useState(false);
  const [selectedChannelPackage, setSelectedChannelPackage] =
    useState<string>("all");
  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] =
    useState<boolean | null>(null);
  const hasLoadedStorage = useRef(false);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  const enabledChannelCount = useMemo(
    () => channels.filter((channel) => channel.enabled).length,
    [channels],
  );

  const loadChannelSettings = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !NativeInbox.readChannelSettings) {
      setChannels(readStoredChannels());
      return;
    }

    try {
      const result = await NativeInbox.readChannelSettings();
      const nativeChannels = Array.isArray(result.channels) ? result.channels : [];
      const normalized = nativeChannels
        .map((channel) => normalizeChannelSetting(channel))
        .filter((channel): channel is ChannelSetting => Boolean(channel));
      setChannels(normalized.length > 0 ? normalized : readStoredChannels());
    } catch {
      setChannels(readStoredChannels());
    }
  }, []);

  const saveChannelSettings = useCallback(async (nextChannels: ChannelSetting[]) => {
    setChannels(nextChannels);
    persistStoredChannels(nextChannels);

    if (!Capacitor.isNativePlatform() || !NativeInbox.saveEnabledChannels) {
      return;
    }

    try {
      const result = await NativeInbox.saveEnabledChannels({
        packages: nextChannels
          .filter((channel) => channel.enabled)
          .map((channel) => channel.packageName),
      });
      const nativeChannels = Array.isArray(result.channels) ? result.channels : [];
      const normalized = nativeChannels
        .map((channel) => normalizeChannelSetting(channel))
        .filter((channel): channel is ChannelSetting => Boolean(channel));
      if (normalized.length > 0) {
        setChannels(normalized);
        persistStoredChannels(normalized);
      }
    } catch {
      // The local UI still reflects the user's channel choice.
    }
  }, []);

  const refreshNotificationAccess = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !NativeInbox.isNotificationAccessEnabled) {
      setIsNotificationAccessEnabled(null);
      return;
    }

    try {
      const result = await NativeInbox.isNotificationAccessEnabled();
      setIsNotificationAccessEnabled(Boolean(result.enabled));
    } catch {
      setIsNotificationAccessEnabled(null);
    }
  }, []);

  const openNotificationAccess = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !NativeInbox.openNotificationAccessSettings) {
      return;
    }

    try {
      await NativeInbox.openNotificationAccessSettings();
      window.setTimeout(() => {
        void refreshNotificationAccess();
      }, 800);
    } catch {
      // The channel panel stays usable even if Android settings cannot open.
    }
  }, [refreshNotificationAccess]);

  const toggleChannel = useCallback(
    (packageName: string) => {
      const nextChannels = channels.map((channel) =>
        channel.packageName === packageName
          ? { ...channel, enabled: !channel.enabled }
          : channel,
      );
      void saveChannelSettings(nextChannels);
    },
    [channels, saveChannelSettings],
  );

  const clearScreen = useCallback(async () => {
    const confirmed = window.confirm(
      "Ekranı tertemiz yapmak istediğine emin misin?",
    );

    if (!confirmed) {
      return;
    }

    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);

    if (Capacitor.isNativePlatform()) {
      try {
        await NativeInbox.clearCapturedMessages();
      } catch {
        // Local screen is still cleared even if the native bridge rejects.
      }
    }
  }, []);
  const enableAllChannels = useCallback(() => {
    const nextChannels = channels.map((channel) => ({
      ...channel,
      enabled: true,
    }));
    void saveChannelSettings(nextChannels);
  }, [channels, saveChannelSettings]);
  const markAsRead = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const syncCapturedMessages = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await NativeInbox.requestNotificationListenerRebind?.();
      const result = await NativeInbox.readCapturedMessages();
      const nativeMessages = Array.isArray(result.messages) ? result.messages : [];
      const captured = nativeMessages
        .map((message) => fromNativeMessage(message))
        .filter((message): message is InboxMessage => Boolean(message));

      if (captured.length > 0) {
        setMessages((current) => {
          const existingIds = new Set(current.map((message) => message.id));
          const fresh = captured.filter((message) => !existingIds.has(message.id));
          return fresh.length > 0 ? sortByNewest([...fresh, ...current]) : current;
        });
      }

      await NativeInbox.clearCapturedMessages();
    } catch {
      // The screen stays passive; Android keeps capture details internally.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMessages(sortByNewest(readStoredMessages()));
      hasLoadedStorage.current = true;
      void loadChannelSettings();
      void refreshNotificationAccess();

      if (Capacitor.isNativePlatform()) {
        window.setTimeout(() => {
          void syncCapturedMessages();
        }, 250);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadChannelSettings, refreshNotificationAccess, syncCapturedMessages]);

  useEffect(() => {
    if (hasLoadedStorage.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!isNative) {
      return;
    }

    const syncSilently = () => {
      void syncCapturedMessages();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncSilently();
        void refreshNotificationAccess();
      }
    };

    const interval = window.setInterval(syncSilently, 3000);
    const handleFocus = () => {
      syncSilently();
      void refreshNotificationAccess();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isNative, refreshNotificationAccess, syncCapturedMessages]);

  const sortedMessages = useMemo(() => sortByNewest(messages), [messages]);
  const enabledChannels = useMemo(
    () => channels.filter((channel) => channel.enabled),
    [channels],
  );
  const areAllChannelsEnabled = useMemo(
    () => channels.length > 0 && channels.every((channel) => channel.enabled),
    [channels],
  );
  const effectiveSelectedChannelPackage = useMemo(
    () =>
      selectedChannelPackage !== "all" &&
      enabledChannels.some(
        (channel) => channel.packageName === selectedChannelPackage,
      )
        ? selectedChannelPackage
        : "all",
    [enabledChannels, selectedChannelPackage],
  );
  const selectedChannel = useMemo(
    () =>
      effectiveSelectedChannelPackage === "all"
        ? null
        : channels.find(
            (channel) => channel.packageName === effectiveSelectedChannelPackage,
          ) ??
          null,
    [channels, effectiveSelectedChannelPackage],
  );
  const visibleMessages = useMemo(() => {
    if (!selectedChannel) {
      return sortedMessages;
    }

    return sortedMessages.filter((message) => {
      if (message.sourcePackage) {
        return message.sourcePackage === selectedChannel.packageName;
      }

      return message.sourceApp === selectedChannel.sourceApp;
    });
  }, [selectedChannel, sortedMessages]);

  return (
    <main className="min-h-screen bg-[#f2f0ea] text-[#171411]">
      <section className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-[#f7f6f2] sm:max-w-[430px]">
        <header className="sticky top-0 z-10 border-b border-[#ded8cd] bg-[#f7f6f2]/95 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7a7065]">
                TekPanel
              </p>
              <h1 className="mt-1 text-[22px] font-black leading-7 tracking-[-0.04em]">
                Gelen mesajlar
              </h1>
            </div>
            <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#171411] px-3 text-sm font-black text-white shadow-sm">
              {visibleMessages.length === 0 ? "0" : visibleMessages.length}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsChannelPanelOpen((current) => !current)}
              className="h-10 rounded-full border border-[#d7d0c4] bg-white px-3 text-center text-[13px] font-black text-[#171411] shadow-sm transition active:scale-[0.98]"
              aria-expanded={isChannelPanelOpen}
              aria-label="Kanalları ayarla"
            >
              Kanalları ayarla
            </button>
            <button
              type="button"
              onClick={() => void clearScreen()}
              className="h-10 rounded-full border border-[#d7d0c4] bg-white px-2 text-center text-[12px] font-black leading-none text-[#171411] shadow-sm transition active:scale-[0.98]"
              aria-label="Ekranı tertemiz yap"
            >
              Ekranı tertemiz yap
            </button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedChannelPackage("all")}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-[12px] font-black shadow-sm transition active:scale-[0.98] ${
                selectedChannelPackage === "all"
                  ? "border-[#171411] bg-[#171411] text-white"
                  : "border-[#ded8cd] bg-white text-[#2f2a25]"
              }`}
              aria-pressed={effectiveSelectedChannelPackage === "all"}
            >
              <span
                className={`flex h-6 min-w-6 items-center justify-center rounded-full text-[10px] font-black ${
                  effectiveSelectedChannelPackage === "all"
                    ? "bg-white text-[#171411]"
                    : "bg-[#171411] text-white"
                }`}
              >
                {sortedMessages.length}
              </span>
              Tüm mesajlar
            </button>
            {enabledChannels.length === 0 ? (
              <span className="rounded-full border border-[#ded8cd] bg-white px-3 py-2 text-xs font-bold text-[#7a7065]">
                Kanal kapalı
              </span>
            ) : (
              enabledChannels.map((channel) => {
                const theme = sourceThemeFor(channel.sourceApp);
                const icon = brandIconFor(channel.sourceApp, channel.packageName);
                const isSelected =
                  effectiveSelectedChannelPackage === channel.packageName;

                return (
                  <button
                    key={channel.packageName}
                    type="button"
                    onClick={() => setSelectedChannelPackage(channel.packageName)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[12px] font-black shadow-sm transition active:scale-[0.98] ${
                      isSelected
                        ? "border-[#171411] bg-[#171411] text-white"
                        : "border-[#ded8cd] bg-white text-[#2f2a25]"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full text-[9px] font-black tracking-[0.08em] ${theme.badgeClass}`}
                    >
                      <BrandIcon
                        className="h-3.5 w-3.5"
                        icon={icon}
                        label={theme.label}
                      />
                    </span>
                    {channel.label}
                  </button>
                );
              })
            )}
          </div>

          <p className="mt-2 text-[13px] font-semibold text-[#7a7065]">
            {messages.length === 0
              ? "Mesaj bildirimi bekleniyor."
              : selectedChannel
                ? `${selectedChannel.label}: ${visibleMessages.length} mesaj görünüyor.`
                : `${sortedMessages.length} mesaj yakalandı, ${enabledChannelCount} kanal açık.`}
          </p>
        </header>

        {isChannelPanelOpen ? (
          <section className="mx-4 mt-3 rounded-[24px] border border-[#ded8cd] bg-white p-3 shadow-[0_18px_42px_rgba(29,24,18,0.1)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-black tracking-[-0.03em]">
                  Kanalları ayarla
                </h2>
                <p className="mt-1 max-w-56 text-xs leading-5 text-[#7a7065]">
                  Sadece açık kanallardan gelen bildirimler ekrana düşer.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={enableAllChannels}
                  disabled={areAllChannelsEnabled}
                  className="h-9 rounded-full bg-[#171411] px-3 text-[11px] font-black uppercase tracking-[0.08em] text-white disabled:bg-[#ded8cd] disabled:text-[#8d8174]"
                >
                  Tümünü aç
                </button>
                <button
                  type="button"
                  onClick={() => setIsChannelPanelOpen(false)}
                  className="h-9 rounded-full border border-[#ded8cd] bg-[#f7f6f2] px-3 text-[11px] font-black uppercase tracking-[0.08em]"
                >
                  Menüyü gizle
                </button>
              </div>
            </div>

            {isNative ? (
              <div className="mt-3 rounded-[18px] border border-[#eee9df] bg-[#fbfaf7] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-black">Bildirim erişimi</p>
                    <p className="mt-1 text-xs leading-5 text-[#7a7065]">
                      TekPanel sadece seçtiğin kanalların görünen bildirim
                      metnini cihazda tutar.
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      isNotificationAccessEnabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[#171411] text-white"
                    }`}
                  >
                    {isNotificationAccessEnabled ? "Açık" : "Kapalı"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void openNotificationAccess()}
                  className="mt-3 h-9 w-full rounded-full border border-[#ded8cd] bg-white px-3 text-[12px] font-black text-[#171411] shadow-sm transition active:scale-[0.98]"
                >
                  Bildirim erişimini aç
                </button>
              </div>
            ) : null}

            {channels.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-[#73685d]">
                Bu telefonda desteklenen mesaj kanalı bulunamadı.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#eee9df] overflow-hidden rounded-[18px] border border-[#eee9df]">
                {channels.map((channel) => {
                  const theme = sourceThemeFor(channel.sourceApp);

                  return (
                    <button
                      key={channel.packageName}
                      type="button"
                      onClick={() => toggleChannel(channel.packageName)}
                      className={`flex min-h-14 w-full items-center justify-between gap-3 bg-white px-3 py-3 text-left transition active:bg-[#f7f6f2] ${
                        channel.enabled ? "" : "opacity-45"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-black tracking-[0.12em] ${theme.badgeClass}`}
                        >
                          <BrandIcon
                            className="h-5 w-5"
                            icon={brandIconFor(channel.sourceApp, channel.packageName)}
                            label={theme.label}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-black">
                            {channel.label}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                          channel.enabled
                            ? "bg-[#171411] text-white"
                            : "bg-[#eee9df] text-[#8d8174]"
                        }`}
                      >
                        {channel.enabled ? "Açık" : "Kapalı"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {visibleMessages.length === 0 ? (
          <div className="flex flex-1 px-3 py-3">
            <section className="h-fit w-full rounded-[22px] border border-[#ded8cd] bg-white px-4 py-4 shadow-sm">
              <p className="text-[16px] font-black tracking-[-0.025em]">
                {messages.length === 0 ? "Bildirim bekleniyor" : "Bu kanalda mesaj yok"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#7a7065]">
                {messages.length === 0
                  ? "WhatsApp, Instagram veya SMS bildirimi gelince burada görünecek."
                  : "Tüm mesajları görmek için üstten Tüm mesajlar'a dokun."}
              </p>
              <div className="mt-4 h-px bg-[#eee9df]" />
              <p className="mt-3 text-[12px] font-bold text-[#9a8e80]">
                {messages.length === 0
                  ? "Ekran temiz."
                  : `${sortedMessages.length} toplam mesaj var.`}
              </p>
            </section>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="overflow-hidden rounded-[26px] border border-[#ded8cd] bg-white shadow-sm">
              {visibleMessages.map((message, index) => {
                const theme = sourceThemeFor(message.sourceApp);
                const icon = brandIconFor(message.sourceApp, message.sourcePackage);

                return (
                  <article
                    key={message.id}
                    className={`relative px-3.5 py-3.5 ${
                      index > 0 ? "border-t border-[#eee9df]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] text-[10px] font-black tracking-[0.12em] shadow-sm ${theme.badgeClass}`}
                        aria-hidden="true"
                      >
                        <BrandIcon
                          className="h-[22px] w-[22px]"
                          icon={icon}
                          label={theme.label}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-[16px] font-black leading-5 tracking-[-0.025em]">
                              {message.senderName}
                            </h2>
                            <div className="mt-1 flex min-w-0 items-center gap-2">
                              <span
                                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ring-1 ${theme.chipClass}`}
                              >
                                {sourceDisplayLabel(message.sourceApp)}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <time className="block text-[11px] font-bold text-[#8d8174]">
                              {formatDateTime(message.receivedAt)}
                            </time>
                            <button
                              type="button"
                              onClick={() => markAsRead(message.id)}
                              className="mt-2 inline-flex h-5 items-center rounded-full border border-[#ded8cd] bg-[#f7f6f2] px-1.5 text-[9px] font-bold leading-none text-[#171411] transition active:scale-[0.95]"
                              aria-label={`${message.senderName} mesajını okundu olarak işaretle`}
                              title="Okundu"
                            >
                              Okundu
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-5 text-[#3d352d]">
                          {message.messageText}
                        </p>

                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
