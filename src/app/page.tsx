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
  accentClass: string;
  label: string;
  icon?: SimpleIcon;
};

const sourceThemes: Record<SourceApp, SourceTheme> = {
  WhatsApp: {
    badgeClass: "bg-[#25D366] text-white",
    borderClass: "border-emerald-300",
    chipClass: "bg-emerald-900/40 text-emerald-300 ring-emerald-700",
    cardClass: "bg-[var(--card)] ring-emerald-900",
    accentClass: "bg-[#25D366]",
    label: "WA",
    icon: siWhatsapp,
  },
  Instagram: {
    badgeClass: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
    borderClass: "border-fuchsia-300",
    chipClass: "bg-fuchsia-900/40 text-fuchsia-300 ring-fuchsia-700",
    cardClass: "bg-[var(--card)] ring-fuchsia-900",
    accentClass: "bg-gradient-to-b from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    label: "IG",
    icon: siInstagram,
  },
  Facebook: {
    badgeClass: "bg-[#1877F2] text-white",
    borderClass: "border-blue-300",
    chipClass: "bg-blue-900/40 text-blue-300 ring-blue-700",
    cardClass: "bg-[var(--card)] ring-blue-900",
    accentClass: "bg-[#1877F2]",
    label: "FB",
    icon: siFacebook,
  },
  TikTok: {
    badgeClass: "bg-zinc-950 text-white",
    borderClass: "border-cyan-300",
    chipClass: "bg-cyan-900/40 text-cyan-300 ring-cyan-700",
    cardClass: "bg-[var(--card)] ring-cyan-900",
    accentClass: "bg-zinc-950",
    label: "TT",
    icon: siTiktok,
  },
  "X / Twitter": {
    badgeClass: "bg-zinc-950 text-white",
    borderClass: "border-zinc-300",
    chipClass: "bg-zinc-800 text-zinc-300 ring-zinc-600",
    cardClass: "bg-[var(--card)] ring-zinc-700",
    accentClass: "bg-zinc-950",
    label: "X",
    icon: siX,
  },
  SMS: {
    badgeClass: "bg-[#1A73E8] text-white",
    borderClass: "border-amber-300",
    chipClass: "bg-amber-900/40 text-amber-300 ring-amber-700",
    cardClass: "bg-[var(--card)] ring-amber-900",
    accentClass: "bg-[#1A73E8]",
    label: "SMS",
    icon: siGooglemessages,
  },
  Diger: {
    badgeClass: "bg-stone-700 text-white",
    borderClass: "border-stone-300",
    chipClass: "bg-stone-800 text-stone-300 ring-stone-600",
    cardClass: "bg-[var(--card)] ring-stone-700",
    accentClass: "bg-stone-700",
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
  const toggleAllChannels = useCallback(() => {
    const shouldEnable = !channels.every((channel) => channel.enabled);
    const nextChannels = channels.map((channel) => ({
      ...channel,
      enabled: shouldEnable,
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

  const todayStamp = useMemo(
    () =>
      new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        weekday: "long",
      }).format(new Date()),
    [],
  );

  const showAccessGate = isNative && isNotificationAccessEnabled === false;

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink-primary)]">
      {showAccessGate ? (
        <section className="fixed inset-0 z-50 mx-auto flex w-full max-w-[390px] flex-col overflow-y-auto bg-[var(--paper)] px-6 pb-8 pt-16 sm:max-w-[430px]">
          <div className="flex flex-1 flex-col">
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
              TekPanel
            </span>
            <h1 className="mt-5 text-[30px] font-black leading-[1.08] tracking-[-0.04em] text-[var(--ink-primary)]">
              Tüm müşteri
              <br />
              mesajların tek
              <br />
              ekranda.
            </h1>
            <p className="mt-4 text-[15px] leading-[1.55] text-[var(--ink-secondary)]">
              WhatsApp, Instagram, Messenger ve SMS bildirimlerini burada
              toplayabilmemiz için tek bir izin vermen yeterli. Sonrası otomatik.
            </p>

            <ol className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[12px] font-black text-[var(--accent-fg)]">
                  1
                </span>
                <span className="text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  Aşağıdaki butona bas. Telefonun bildirim izni ekranı açılacak.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[12px] font-black text-[var(--accent-fg)]">
                  2
                </span>
                <span className="text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  Listeden{" "}
                  <span className="font-black text-[var(--ink-primary)]">
                    TekPanel
                  </span>{" "}
                  satırını bul, yanındaki anahtarı aç.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[12px] font-black text-[var(--accent-fg)]">
                  3
                </span>
                <span className="text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  Çıkan onayda{" "}
                  <span className="font-black text-[var(--ink-primary)]">
                    İzin ver
                  </span>{" "}
                  de ve geri dön. Hepsi bu.
                </span>
              </li>
            </ol>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => void openNotificationAccess()}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--accent-bg)] text-[16px] font-black tracking-[-0.01em] text-[var(--accent-fg)] transition active:scale-[0.98]"
            >
              İzin ekranını aç
            </button>
            <button
              type="button"
              onClick={() => void refreshNotificationAccess()}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl text-[13px] font-bold text-[var(--ink-muted)] transition active:scale-[0.98]"
            >
              İzni verdim, kontrol et
            </button>
            <p className="mt-4 text-center text-[12px] leading-[1.5] text-[var(--ink-faint)]">
              TekPanel mesajlarını yalnızca senin telefonunda tutar, hiçbir
              sunucuya göndermez.
            </p>
          </div>
        </section>
      ) : null}
      {isChannelPanelOpen ? (
        <section className="ledger-panel-in fixed inset-0 z-40 mx-auto flex w-full max-w-[390px] flex-col overflow-y-auto bg-[var(--accent-bg)] px-4 pb-6 pt-4 text-[var(--accent-fg)] sm:max-w-[430px]">
          <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div className="min-w-0">
              <span className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-black/55">
                TekPanel
              </span>
              <h2 className="mt-1 text-[21px] font-black tracking-[-0.035em]">
                Kanalları ayarla
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-black/60">
                {enabledChannelCount} kanal açık
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsChannelPanelOpen(false)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-fg)] text-[28px] font-black leading-none text-[var(--accent-bg)] transition active:scale-[0.95]"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>

          {channels.length === 0 ? (
            <p className="py-5 text-[14px] leading-6 text-black/65">
              Bu telefonda mesaj kanalı bulunamadı.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
              <button
                type="button"
                onClick={() => void toggleAllChannels()}
                className="flex min-h-[56px] w-full items-center justify-between gap-3 border-b border-black/10 bg-black/[0.04] px-4 py-3 text-left transition active:scale-[0.99]"
                aria-label="Tümünü aç"
                aria-pressed={areAllChannelsEnabled}
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-black text-black">
                    Tümünü aç
                  </span>
                  <span className="mt-0.5 block text-[12px] font-semibold text-black/55">
                    Tek dokunuşla tüm kaynakları seç
                  </span>
                </span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-[15px] font-black leading-none transition ${
                    areAllChannelsEnabled
                      ? "border-black bg-black text-white"
                      : "border-black/25 bg-transparent text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>

              {channels.map((channel) => {
                const theme = sourceThemeFor(channel.sourceApp);

                return (
                  <button
                    key={channel.packageName}
                    type="button"
                    onClick={() => toggleChannel(channel.packageName)}
                    className="flex min-h-[60px] w-full items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 text-left text-black transition last:border-b-0 active:bg-black/[0.04]"
                    aria-pressed={channel.enabled}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black tracking-[0.12em] ${theme.badgeClass}`}
                      >
                        <BrandIcon
                          className="h-5 w-5"
                          icon={brandIconFor(channel.sourceApp, channel.packageName)}
                          label={theme.label}
                        />
                      </span>
                      <span className="block min-w-0">
                        <span className="block truncate text-[15px] font-bold">
                          {channel.label}
                        </span>
                        <span className="mt-0.5 block text-[12px] font-semibold text-black/50">
                          {channel.enabled ? "Açık" : "Kapalı"}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-[15px] font-black leading-none transition ${
                        channel.enabled
                          ? "border-black bg-black text-white"
                          : "border-black/25 bg-transparent text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {isNative && !isNotificationAccessEnabled ? (
            <button
              type="button"
              onClick={() => void openNotificationAccess()}
              className="mt-4 block w-full rounded-2xl bg-[var(--accent-fg)] px-4 py-4 text-left text-[var(--accent-bg)] transition active:scale-[0.99]"
            >
              <span className="block text-[15px] font-black">
                Bu ayarı açman gerekiyor
              </span>
              <span className="mt-1 block text-[13px] leading-5 text-white/75">
                Dokun, açılan listede TekPanel&apos;e bildirim erişimi izni ver.
              </span>
            </button>
          ) : null}
        </section>
      ) : null}
      <section className="paper-grain mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden sm:max-w-[430px]">
        <header className="sticky top-0 z-10  bg-[var(--surface)]/92 px-4 pb-3 pt-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">

              <span className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                TekPanel
              </span>
              <h1 className="mt-1 text-[22px] font-black leading-7 tracking-[-0.04em] text-[var(--ink-primary)]">
                Gelen mesajlar
              </h1>
              <p className="mono mt-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-secondary)]">
                {todayStamp}
              </p>
            </div>
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
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsChannelPanelOpen((current) => !current)}
              className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-center text-[13px] font-bold transition active:scale-[0.98] ${
                isChannelPanelOpen
                  ? "border-[var(--accent-bg)] bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                  : "border-[var(--border-strong)] bg-[var(--card)] text-[var(--ink-primary)]"
              }`}
              aria-expanded={isChannelPanelOpen}
              aria-label="Kanalları ayarla"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isChannelPanelOpen ? "bg-[var(--accent-fg)]" : "bg-[var(--accent-bg)]"
                }`}
              />
              Kanalları ayarla
            </button>
            <button
              type="button"
              onClick={() => void clearScreen()}
              className="flex h-11 items-center justify-center rounded-2xl  bg-[var(--card)] px-2 text-center text-[12px] font-bold leading-none text-[var(--ink-primary)] transition active:scale-[0.98]"
              aria-label="Ekranı tertemiz yap"
            >
              Ekranı tertemiz yap
            </button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedChannelPackage("all")}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-[12px] font-bold transition active:scale-[0.98] ${
                selectedChannelPackage === "all"
                  ? "border-[var(--accent-bg)] bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                  : "border-[var(--border-strong)] bg-[var(--card)] text-[var(--ink-secondary)]"
              }`}
              aria-pressed={effectiveSelectedChannelPackage === "all"}
            >
              <span
                className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-black tabular-nums ${
                  effectiveSelectedChannelPackage === "all"
                    ? "bg-[var(--accent-fg)] text-[var(--accent-bg)]"
                    : "bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                }`}
              >
                {sortedMessages.length}
              </span>
              Tüm mesajlar
            </button>
            {enabledChannels.length === 0 ? (
              <span className="inline-flex h-9 items-center rounded-full  bg-[var(--card)] px-3 text-xs font-semibold text-[var(--ink-muted)]">
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
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[12px] font-bold transition active:scale-[0.98] ${
                      isSelected
                        ? "border-[var(--accent-bg)] bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                        : "border-[var(--border-strong)] bg-[var(--card)] text-[var(--ink-secondary)]"
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

          <p className="mt-2.5 text-[13px] font-semibold text-[var(--ink-muted)]">
            {messages.length === 0
              ? "Mesaj bildirimi bekleniyor."
              : selectedChannel
                ? `${selectedChannel.label}: ${visibleMessages.length} mesaj görünüyor.`
                : `${sortedMessages.length} mesaj yakalandı, ${enabledChannelCount} kanal açık.`}
          </p>
        </header>

        {isChannelPanelOpen ? (
          <section className="ledger-panel-in mx-4 mt-3 overflow-hidden rounded-3xl bg-[var(--card)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-[17px] font-black tracking-[-0.03em] text-[var(--ink-primary)]">
                Kanallar
              </h2>
              <button
                type="button"
                onClick={() => setIsChannelPanelOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--subtle)] text-[18px] font-black leading-none text-[var(--ink-primary)] transition active:scale-[0.95]"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            {channels.length === 0 ? (
              <p className="px-4 py-4 text-[14px] leading-6 text-[var(--ink-secondary)]">
                Bu telefonda mesaj kanalı bulunamadı.
              </p>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => void toggleAllChannels()}
                  className="flex min-h-[52px] w-full items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[var(--subtle)] px-4 py-3 text-left transition active:scale-[0.99]"
                  aria-label="Tümünü seç"
                  aria-pressed={areAllChannelsEnabled}
                >
                  <span className="text-[14px] font-black text-[var(--ink-primary)]">
                    Tümü
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[15px] font-black leading-none transition ${
                      areAllChannelsEnabled
                        ? "border-[var(--accent-bg)] bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                        : "border-[var(--border-strong)] bg-transparent text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>

                {channels.map((channel) => {
                  const theme = sourceThemeFor(channel.sourceApp);

                  return (
                    <button
                      key={channel.packageName}
                      type="button"
                      onClick={() => toggleChannel(channel.packageName)}
                      className="flex min-h-[56px] w-full items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[var(--card)] px-4 py-3 text-left transition active:bg-[var(--subtle)]"
                      aria-pressed={channel.enabled}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black tracking-[0.12em] ${theme.badgeClass}`}
                        >
                          <BrandIcon
                            className="h-5 w-5"
                            icon={brandIconFor(channel.sourceApp, channel.packageName)}
                            label={theme.label}
                          />
                        </span>
                        <span className="block truncate text-[15px] font-bold text-[var(--ink-primary)]">
                          {channel.label}
                        </span>
                      </span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[15px] font-black leading-none transition ${
                          channel.enabled
                            ? "border-[var(--accent-bg)] bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                            : "border-[var(--border-strong)] bg-transparent text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {isNative && !isNotificationAccessEnabled ? (
              <button
                type="button"
                onClick={() => void openNotificationAccess()}
                className="block w-full bg-[var(--accent-bg)] px-4 py-4 text-left transition active:scale-[0.99]"
              >
                <span className="block text-[15px] font-black text-[var(--accent-fg)]">
                  Bu ayarı açman gerekiyor
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-[var(--accent-fg)]/80">
                  Dokun, açılan listede TekPanel’e bildirim erişimi izni ver.
                </span>
              </button>
            ) : null}
          </section>
        ) : null}

        {visibleMessages.length === 0 ? (
          <div className="flex flex-1 px-4 py-4">
            <section className="h-fit w-full overflow-hidden rounded-3xl  bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--subtle)] px-4 py-2">
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Kayıt defteri
                </span>
                <span className="mono text-[10px] tabular-nums tracking-[0.12em] text-[var(--ink-faint)]">
                  00 kayıt
                </span>
              </div>
              <div className="px-4 py-5">
                <p className="text-[16px] font-black tracking-[-0.025em] text-[var(--ink-primary)]">
                  {messages.length === 0 ? "Bildirim bekleniyor" : "Bu kanalda mesaj yok"}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink-muted)]">
                  {messages.length === 0
                    ? "WhatsApp, Instagram veya SMS bildirimi gelince burada görünecek."
                    : "Tüm mesajları görmek için üstten Tüm mesajlar'a dokun."}
                </p>
                <p className="mono mt-4 text-[11px] tracking-[0.04em] text-[var(--ink-faint)]">
                  {messages.length === 0
                    ? "// ekran temiz."
                    : `// ${sortedMessages.length} toplam mesaj var.`}
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="overflow-hidden rounded-3xl  bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--subtle)] px-4 py-2">
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Kayıt defteri
                </span>
                <span className="mono text-[10px] tabular-nums tracking-[0.12em] text-[var(--ink-faint)]">
                  {String(visibleMessages.length).padStart(2, "0")} kayıt
                </span>
              </div>
              {visibleMessages.map((message, index) => {
                const theme = sourceThemeFor(message.sourceApp);
                const icon = brandIconFor(message.sourceApp, message.sourcePackage);

                return (
                  <article
                    key={message.id}
                    className="ledger-row-in relative flex gap-0 border-t border-[var(--border-soft)]"
                  >
                    {/* Platform accent rail — the ledger signature */}
                    <span
                      className={`w-[3px] shrink-0 ${theme.accentClass}`}
                      aria-hidden="true"
                    />

                    <div className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-3.5">
                      <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[10px] font-black tracking-[0.12em] ${theme.badgeClass}`}
                          aria-hidden="true"
                        >
                          <BrandIcon
                            className="h-[22px] w-[22px]"
                            icon={icon}
                            label={theme.label}
                          />
                        </div>
                        <span className="mono text-[9px] tabular-nums tracking-[0.1em] text-[var(--ink-faint)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-[16px] font-black leading-5 tracking-[-0.025em] text-[var(--ink-primary)]">
                              {message.senderName}
                            </h2>
                            <div className="mt-1.5 flex min-w-0 items-center gap-2">
                              <span
                                className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ring-1 ${theme.chipClass}`}
                              >
                                {sourceDisplayLabel(message.sourceApp)}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <time className="mono block text-[10px] tabular-nums tracking-[0.04em] text-[var(--ink-faint)]">
                              {formatDateTime(message.receivedAt)}
                            </time>
                            <button
                              type="button"
                              onClick={() => markAsRead(message.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full  bg-[var(--subtle)] px-3 text-[11px] font-bold leading-none text-[var(--ink-primary)] transition active:scale-[0.95]"
                              aria-label={`${message.senderName} mesajını okundu olarak işaretle`}
                              title="Okundu"
                            >
                              <span className="text-[12px] leading-none">✓</span>
                              Okundu
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
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
