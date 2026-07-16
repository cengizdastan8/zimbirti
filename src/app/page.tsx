"use client";



import { Capacitor, registerPlugin } from "@capacitor/core";

import { App } from "@capacitor/app";

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

type PermissionExperimentVariant = "direct" | "primed";



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

type ActiveTab = "messages" | "contacts" | "settings";

type Conversation = {
  id: string;
  sourceApp: SourceApp;
  sourcePackage?: string;
  senderName: string;
  customerId?: string;
  messages: InboxMessage[];
  latestMessage: InboxMessage;
  unreadCount: number;
};

type ChannelUndoState = {
  channels: ChannelSetting[];
  label: string;
} | null;



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

  iconBase64?: string;

};



type NativeInboxPlugin = {

  readCapturedMessages: () => Promise<{ messages: NativeCapturedMessage[] }>;

  clearCapturedMessages: () => Promise<void>;

  isNotificationAccessEnabled?: () => Promise<{ enabled: boolean }>;

  openNotificationAccessSettings?: () => Promise<void>;

  readChannelSettings?: () => Promise<{ channels: NativeChannelSetting[] }>;

  scanInstalledChannels?: () => Promise<{ channels: NativeChannelSetting[] }>;

  saveEnabledChannels?: (options: { packages: string[] }) => Promise<{

    channels: NativeChannelSetting[];

  }>;

  requestNotificationListenerRebind?: () => Promise<void>;

};



type BillingPlanId = "monthly" | "quarterly" | "semiannual" | "yearly";



type BillingPlan = {

  id: BillingPlanId;

  productId: string;

  label: string;

  price: string;

  saving: string;

  billingPeriod?: string;

  available?: boolean;

};



type BillingStatus = {

  active: boolean;

  available?: boolean;

  productId?: string;

  plans?: BillingPlan[];

  message?: string;

};



type NativeBillingPlugin = {

  getSubscriptionStatus: () => Promise<BillingStatus>;

  purchase: (options: { planId: BillingPlanId }) => Promise<{

    started: boolean;

    planId?: BillingPlanId;

  }>;

  restorePurchases: () => Promise<BillingStatus>;

};



type NativeChannelSetting = {

  label?: string;

  sourceApp?: SourceApp | string;

  packageName?: string;

  installed?: boolean;

  enabled?: boolean;

  iconBase64?: string;

};



const STORAGE_KEY = "tekpanel:phase1:messages";

const CHANNEL_STORAGE_KEY = "tekpanel:enabledChannels";

const TRIAL_STARTED_KEY = "tekpanel:trialStartedAt";

const PERMISSION_EXPERIMENT_VARIANT_KEY = "tekpanel:permissionExperimentVariant";

const PERMISSION_EXPERIMENT_EVENTS_KEY = "tekpanel:permissionExperimentEvents";

const TRIAL_DAYS = 3;

const NativeInbox = registerPlugin<NativeInboxPlugin>("TekPanelInbox");

const NativeBilling = registerPlugin<NativeBillingPlugin>("TekPanelBilling");



const fallbackBillingPlans: BillingPlan[] = [

  {

    available: true,

    id: "monthly",

    label: "1 ay",

    price: "$5",

    productId: "tekpanel_pro",

    saving: "Aylık kullanım",

  },

  {

    available: true,

    id: "quarterly",

    label: "3 ay",

    price: "$10",

    productId: "tekpanel_pro",

    saving: "1 ay avantajlı",

  },

  {

    available: true,

    id: "semiannual",

    label: "6 ay",

    price: "$20",

    productId: "tekpanel_pro",

    saving: "2 ay avantajlı",

  },

  {

    available: true,

    id: "yearly",

    label: "12 ay",

    price: "$45",

    productId: "tekpanel_pro",

    saving: "3 ay avantajlı",

  },

];



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

    iconBase64: typeof value.iconBase64 === "string" && value.iconBase64.trim() ? value.iconBase64.trim() : undefined,

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



const readPermissionExperimentVariant = (): PermissionExperimentVariant => {

  try {

    const stored = localStorage.getItem(PERMISSION_EXPERIMENT_VARIANT_KEY);

    if (stored === "direct" || stored === "primed") {

      return stored;

    }



    const nextVariant: PermissionExperimentVariant =

      Math.random() < 0.5 ? "direct" : "primed";

    localStorage.setItem(PERMISSION_EXPERIMENT_VARIANT_KEY, nextVariant);

    return nextVariant;

  } catch {

    return "primed";

  }

};



const trackPermissionExperimentEvent = (

  variant: PermissionExperimentVariant | null,

  eventName: string,

) => {

  try {

    const raw = localStorage.getItem(PERMISSION_EXPERIMENT_EVENTS_KEY);

    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    const events = Array.isArray(parsed) ? parsed : [];

    events.push({

      eventName,

      timestamp: new Date().toISOString(),

      variant: variant ?? "unknown",

    });

    localStorage.setItem(

      PERMISSION_EXPERIMENT_EVENTS_KEY,

      JSON.stringify(events.slice(-100)),

    );

  } catch {

    // Analytics is best-effort in the local experiment build.

  }

};



const sortByNewest = (messages: InboxMessage[]) =>

  [...messages].sort(

    (left, right) =>

      new Date(right.receivedAt).getTime() -

      new Date(left.receivedAt).getTime(),

  );

const conversationKeyFor = (message: InboxMessage) => {
  const base =
    message.customerId && message.customerId.trim().length > 0
      ? message.customerId
      : `${message.sourceApp}:${message.senderName}`;

  return base.trim().toLocaleLowerCase("tr-TR");
};

const groupMessagesIntoConversations = (messages: InboxMessage[]) => {
  const grouped = new Map<string, InboxMessage[]>();

  for (const message of messages) {
    const key = conversationKeyFor(message);
    grouped.set(key, [...(grouped.get(key) ?? []), message]);
  }

  return [...grouped.entries()]
    .map(([id, conversationMessages]) => {
      const sorted = sortByNewest(conversationMessages);
      const latestMessage = sorted[0];

      return {
        id,
        sourceApp: latestMessage.sourceApp,
        sourcePackage: latestMessage.sourcePackage,
        senderName: latestMessage.senderName,
        customerId: latestMessage.customerId,
        messages: sorted,
        latestMessage,
        unreadCount: sorted.length,
      } satisfies Conversation;
    })
    .sort(
      (left, right) =>
        new Date(right.latestMessage.receivedAt).getTime() -
        new Date(left.latestMessage.receivedAt).getTime(),
    );
};



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

  const [channelUndo, setChannelUndo] = useState<ChannelUndoState>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("messages");

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const [isChannelPanelOpen, setIsChannelPanelOpen] = useState(false);

  const [selectedChannelPackage, setSelectedChannelPackage] =

    useState<string>("all");

  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] =

    useState<boolean | null>(null);

  const [permissionExperimentVariant, setPermissionExperimentVariant] =

    useState<PermissionExperimentVariant | null>(null);

  const [isPermissionPrimerOpen, setIsPermissionPrimerOpen] = useState(false);

  const [billingPlans, setBillingPlans] =

    useState<BillingPlan[]>(fallbackBillingPlans);

  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  const [isBillingAvailable, setIsBillingAvailable] = useState(false);

  const [billingMessage, setBillingMessage] = useState("");

  const [isBillingSheetOpen, setIsBillingSheetOpen] = useState(false);

  const [billingBusyPlan, setBillingBusyPlan] = useState<BillingPlanId | "restore" | null>(null);

  const [trialStartedAt, setTrialStartedAt] = useState<number | null>(null);

  const [now, setNow] = useState(() => Date.now());

  const hasLoadedStorage = useRef(false);
  const isBillingSheetOpenRef = useRef(false);
  const isChannelPanelOpenRef = useRef(false);
  const isPermissionPrimerOpenRef = useRef(false);
  const activeTabRef = useRef<ActiveTab>("messages");
  const selectedConversationIdRef = useRef<string | null>(null);
  const hasTrackedPermissionGrant = useRef(false);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);

  const enabledChannelCount = useMemo(

    () => channels.filter((channel) => channel.enabled).length,

    [channels],

  );



  const applyBillingStatus = useCallback((status: BillingStatus) => {

    const nextPlans =

      Array.isArray(status.plans) && status.plans.length > 0

        ? fallbackBillingPlans.map((fallback) => {

            const nativePlan = status.plans?.find((plan) => plan.id === fallback.id);

            return nativePlan ? { ...fallback, ...nativePlan } : fallback;

          })

        : fallbackBillingPlans;



    setBillingPlans(nextPlans);

    setIsSubscriptionActive(Boolean(status.active));

    setIsBillingAvailable(Boolean(status.available));

    setBillingMessage(String(status.message ?? ""));

  }, []);



  const refreshBillingStatus = useCallback(async () => {

    if (!Capacitor.isNativePlatform()) {

      setBillingPlans(fallbackBillingPlans);

      setIsBillingAvailable(false);

      setIsSubscriptionActive(false);

      setBillingMessage("Ödeme Google Play sürümünde aktif olur.");

      return;

    }



    try {

      const status = await NativeBilling.getSubscriptionStatus();

      applyBillingStatus(status);

    } catch (error) {

      setBillingPlans(fallbackBillingPlans);

      setIsBillingAvailable(false);

      setBillingMessage(

        error instanceof Error

          ? error.message

          : "Google Play ödeme durumu okunamadı.",

      );

    }

  }, [applyBillingStatus]);



  const purchasePlan = useCallback(

    async (planId: BillingPlanId) => {

      if (!Capacitor.isNativePlatform()) {

        setBillingMessage("Satın alma Google Play sürümünde çalışır.");

        return;

      }



      setBillingBusyPlan(planId);

      setBillingMessage("");



      try {

        await NativeBilling.purchase({ planId });

        window.setTimeout(() => {

          void refreshBillingStatus();

        }, 1400);

      } catch (error) {

        setBillingMessage(

          error instanceof Error ? error.message : "Satın alma başlatılamadı.",

        );

      } finally {

        setBillingBusyPlan(null);

      }

    },

    [refreshBillingStatus],

  );



  const restorePurchases = useCallback(async () => {

    if (!Capacitor.isNativePlatform()) {

      setBillingMessage("Geri yükleme Google Play sürümünde çalışır.");

      return;

    }



    setBillingBusyPlan("restore");

    setBillingMessage("");



    try {

      const status = await NativeBilling.restorePurchases();

      applyBillingStatus(status);

      setBillingMessage(status.active ? "Abonelik aktif." : "Aktif abonelik bulunamadı.");

    } catch (error) {

      setBillingMessage(

        error instanceof Error ? error.message : "Satın almalar geri yüklenemedi.",

      );

    } finally {

      setBillingBusyPlan(null);

    }

  }, [applyBillingStatus]);



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



  const scanInstalledChannels = useCallback(async () => {

    if (!Capacitor.isNativePlatform() || !NativeInbox.scanInstalledChannels) {

      await loadChannelSettings();

      return;

    }



    try {

      const result = await NativeInbox.scanInstalledChannels();

      const nativeChannels = Array.isArray(result.channels) ? result.channels : [];

      const normalized = nativeChannels

        .map((channel) => normalizeChannelSetting(channel))

        .filter((channel): channel is ChannelSetting => Boolean(channel));

      setChannels(normalized.length > 0 ? normalized : readStoredChannels());

    } catch {

      await loadChannelSettings();

    }

  }, [loadChannelSettings]);



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
      const enabled = Boolean(result.enabled);
      setIsNotificationAccessEnabled(enabled);
      if (enabled && !hasTrackedPermissionGrant.current) {
        hasTrackedPermissionGrant.current = true;
        trackPermissionExperimentEvent(permissionExperimentVariant, "permission_granted");
      }
    } catch {
      setIsNotificationAccessEnabled(null);
    }
  }, [permissionExperimentVariant]);


  const openNotificationAccess = useCallback(async () => {

    if (!Capacitor.isNativePlatform() || !NativeInbox.openNotificationAccessSettings) {

      return;

    }



    try {

      trackPermissionExperimentEvent(permissionExperimentVariant, "settings_opened");

      await NativeInbox.openNotificationAccessSettings();

      window.setTimeout(() => {

        void refreshNotificationAccess();

      }, 800);

    } catch {

      // The channel panel stays usable even if Android settings cannot open.

    }

  }, [permissionExperimentVariant, refreshNotificationAccess]);



  const requestNotificationAccess = useCallback(() => {

    trackPermissionExperimentEvent(permissionExperimentVariant, "cta_clicked");

    void openNotificationAccess();

  }, [openNotificationAccess, permissionExperimentVariant]);



  const continueFromPermissionPrimer = useCallback(() => {

    trackPermissionExperimentEvent(permissionExperimentVariant, "primer_accepted");

    setIsPermissionPrimerOpen(false);

    void openNotificationAccess();

  }, [openNotificationAccess, permissionExperimentVariant]);



  useEffect(() => {

    const timer = window.setTimeout(() => {

      setPermissionExperimentVariant(readPermissionExperimentVariant());

    }, 0);



    return () => window.clearTimeout(timer);

  }, []);



  useEffect(() => {

    const timer = window.setTimeout(() => {

      const raw = localStorage.getItem(TRIAL_STARTED_KEY);

      const parsed = raw ? Number(raw) : 0;

      const startedAt = Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();



      if (!raw) {

        localStorage.setItem(TRIAL_STARTED_KEY, String(startedAt));

      }



      setTrialStartedAt(startedAt);

    }, 0);



    return () => window.clearTimeout(timer);

  }, []);



  useEffect(() => {

    const timer = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => window.clearInterval(timer);

  }, []);



  const toggleChannel = useCallback(

    (packageName: string) => {
      setChannelUndo(null);

      const nextChannels = channels.map((channel) =>

        channel.packageName === packageName

          ? { ...channel, enabled: !channel.enabled }

          : channel,

      );

      void saveChannelSettings(nextChannels);

    },

    [channels, saveChannelSettings],

  );



  const toggleAllChannels = useCallback(() => {

    const shouldEnable = !channels.every((channel) => channel.enabled);
    const previousEnabledCount = channels.filter((channel) => channel.enabled).length;

    const nextChannels = channels.map((channel) => ({

      ...channel,

      enabled: shouldEnable,

    }));

    setChannelUndo({
      channels,
      label: shouldEnable
        ? `${previousEnabledCount} açık kanala geri dön`
        : `${previousEnabledCount} açık kanalı geri getir`,
    });

    void saveChannelSettings(nextChannels);

  }, [channels, saveChannelSettings]);

  const undoChannelBulkChange = useCallback(() => {
    if (!channelUndo) {
      return;
    }

    const previousChannels = channelUndo.channels;
    setChannelUndo(null);
    void saveChannelSettings(previousChannels);
  }, [channelUndo, saveChannelSettings]);

  const markConversationAsRead = useCallback((conversation: Conversation) => {
    const ids = new Set(conversation.messages.map((message) => message.id));
    setMessages((current) => current.filter((message) => !ids.has(message.id)));
    setSelectedConversationId((current) =>
      current === conversation.id ? null : current,
    );
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

      void refreshBillingStatus();



      if (Capacitor.isNativePlatform()) {

        window.setTimeout(() => {

          void syncCapturedMessages();

        }, 250);

      }

    }, 0);



    return () => window.clearTimeout(timer);

  }, [loadChannelSettings, refreshBillingStatus, refreshNotificationAccess, syncCapturedMessages]);



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

        void refreshBillingStatus();

      }

    };



    const interval = window.setInterval(syncSilently, 3000);

    const handleFocus = () => {

      syncSilently();

      void refreshNotificationAccess();

      void refreshBillingStatus();

    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);



    return () => {

      window.clearInterval(interval);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

    };

  }, [isNative, refreshBillingStatus, refreshNotificationAccess, syncCapturedMessages]);



  useEffect(() => {

    isBillingSheetOpenRef.current = isBillingSheetOpen;

  }, [isBillingSheetOpen]);



  useEffect(() => {

    isChannelPanelOpenRef.current = isChannelPanelOpen;

  }, [isChannelPanelOpen]);

  useEffect(() => {
    isPermissionPrimerOpenRef.current = isPermissionPrimerOpen;
  }, [isPermissionPrimerOpen]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);



  useEffect(() => {

    if (!isNative) {

      return;

    }



    const closeTopLayerOrStay = () => {

      if (isBillingSheetOpenRef.current) {

        setIsBillingSheetOpen(false);

      } else if (isChannelPanelOpenRef.current) {

        setIsChannelPanelOpen(false);

      } else if (isPermissionPrimerOpenRef.current) {

        setIsPermissionPrimerOpen(false);

      } else if (selectedConversationIdRef.current) {

        setSelectedConversationId(null);

      } else if (activeTabRef.current !== "messages") {

        setActiveTab("messages");

      } else {

        void App.exitApp();

      }



      window.history.pushState({ tekpanelGuard: true }, "");

    };



    let isMounted = true;

    let removeBackButtonListener: (() => void) | undefined;



    window.history.replaceState({ tekpanel: true }, "");

    window.history.pushState({ tekpanelGuard: true }, "");

    window.addEventListener("popstate", closeTopLayerOrStay);



    void App.addListener("backButton", closeTopLayerOrStay).then((listener) => {

      if (!isMounted) {

        void listener.remove();

        return;

      }



      removeBackButtonListener = () => {

        void listener.remove();

      };

    });



    return () => {

      isMounted = false;

      window.removeEventListener("popstate", closeTopLayerOrStay);

      removeBackButtonListener?.();

    };

  }, [isNative]);



  const sortedMessages = useMemo(() => sortByNewest(messages), [messages]);

  const conversations = useMemo(
    () => groupMessagesIntoConversations(sortedMessages),
    [sortedMessages],
  );

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

  const visibleConversations = useMemo(
    () => groupMessagesIntoConversations(visibleMessages),
    [visibleMessages],
  );

  const selectedConversation = useMemo(
    () =>
      selectedConversationId === null
        ? null
        : conversations.find(
            (conversation) => conversation.id === selectedConversationId,
          ) ?? null,
    [conversations, selectedConversationId],
  );

  const trialEndsAt =

    trialStartedAt === null

      ? null

      : trialStartedAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;

  const trialMsLeft = trialEndsAt === null ? null : trialEndsAt - now;

  const isTrialExpired =

    trialMsLeft !== null && trialMsLeft <= 0 && !isSubscriptionActive;



  return (

    <main className="singlepanel-shell min-h-screen text-[var(--ink-primary)]">
      {isChannelPanelOpen ? (

        <section className="ledger-panel-in fixed inset-0 z-40 mx-auto flex w-full max-w-[430px] flex-col bg-black/40 px-5 pb-6 pt-8 backdrop-blur-[2px]">

          <div className="channel-sheet mt-auto max-h-[88vh] overflow-y-auto rounded-[20px] p-3">

            <div className="flex items-center gap-4 px-1 pb-5">
              <button
                type="button"
                onClick={() => setIsChannelPanelOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-white transition active:scale-[0.97]"
                aria-label="Kapat"
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.05"><path d="M15 18l-6-6 6-6"/></svg>
              </button>

              <div className="min-w-0">

                <h2 className="text-[33px] font-black leading-9 tracking-[-0.04em] text-white">Connections</h2>

                <p className="mt-1 text-[13px] font-semibold text-[var(--ink-secondary)]">

                  {enabledChannelCount} connected / {channels.length} sources

                </p>

              </div>

            </div>



            <div className="no-scrollbar space-y-2.5 pb-1">

              {channels.length === 0 ? (

                <p className="px-4 py-5 text-[14px] leading-6 text-[var(--ink-secondary)]">

                  Bu telefonda mesaj kanalı bulunamadı.

                </p>

              ) : (

                <>

                  <button

                    type="button"

                    onClick={() => void toggleAllChannels()}

                    className="channel-row flex min-h-[82px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition active:scale-[0.99]"

                    aria-label="Tüm kanalları değiştir"

                    aria-pressed={areAllChannelsEnabled}

                  >

                    <span className="flex min-w-0 items-center gap-3">

                      <span className="channel-all-icon">
                        <span className="channel-all-dot bg-[#ff2e55]" />
                        <span className="channel-all-dot bg-[#1687ff]" />
                        <span className="channel-all-dot bg-[#22c55e]" />
                      </span>

                      <span className="min-w-0">

                      <span className="block text-[22px] font-black leading-6 text-white">

                        Tüm kanallar

                      </span>

                      <span className="mt-0.5 block text-[12px] font-semibold leading-4 text-[var(--ink-muted)]">

                        Toplu değiştirir. Yanlışsa geri alabilirsin.

                      </span>

                      </span>

                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <span className="channel-check" data-on={areAllChannelsEnabled}>✓</span>
                      <span className="channel-chevron">›</span>
                    </span>

                  </button>

                  {channelUndo ? (
                    <button
                      type="button"
                      onClick={undoChannelBulkChange}
                      className="channel-undo tap-target flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-[14px] font-black text-white transition active:scale-[0.99]"
                    >
                      <span>{channelUndo.label}</span>
                      <span className="text-[12px] text-white/70">Geri al</span>
                    </button>
                  ) : null}



                  {channels.map((channel) => {

                    const theme = sourceThemeFor(channel.sourceApp);



                    return (

                      <button

                        key={channel.packageName}

                        type="button"

                        onClick={() => toggleChannel(channel.packageName)}

                        className="channel-row flex min-h-[88px] w-full items-center justify-between gap-4 px-4 py-3 text-left text-[var(--ink-primary)] transition active:scale-[0.99]"

                        aria-pressed={channel.enabled}

                      >

                        <span className="flex min-w-0 items-center gap-3">

                          <span

                            className={`channel-app-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[10px] font-black tracking-[0.08em] ${

                              channel.iconBase64 ? "bg-[var(--card)] text-white" : theme.badgeClass

                            }`}

                          >

                            {channel.iconBase64 ? (

                              <img

                                src={`data:image/png;base64,${channel.iconBase64}`}

                                alt=""

                                className="h-11 w-11 rounded-xl object-contain"

                              />

                            ) : (

                              <BrandIcon

                                className="h-9 w-9"

                                icon={brandIconFor(channel.sourceApp, channel.packageName)}

                                label={theme.label}

                              />

                            )}

                          </span>

                          <span className="block min-w-0">

                            <span className="block truncate text-[22px] font-black leading-7 text-white">

                              {channel.label}

                            </span>

                            <span className="mt-0.5 block truncate text-[16px] font-medium text-[#B9C4DC]">

                              <span className={channel.enabled ? "text-[#22C55E]" : "text-[#64748B]"}>●</span> {channel.enabled ? "Connected" : "Off"}

                            </span>

                          </span>

                        </span>

                        <span className="flex shrink-0 items-center gap-2">
                          <span className="channel-check" data-on={channel.enabled}>✓</span>
                          <span className="channel-chevron">›</span>
                        </span>

                      </button>

                    );

                  })}

                </>

              )}

            </div>



            <div className="grid gap-2.5 pt-2.5">
              <button

                type="button"

                onClick={() => void scanInstalledChannels()}

                className="channel-add tap-target flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] font-bold leading-5 text-white transition active:scale-[0.99]"

              >

                Kanal ekle / telefondaki uygulamaları tara

                <span className="text-[18px] leading-none">+</span>

              </button>

            </div>

          </div>

        </section>

      ) : null}

      {isPermissionPrimerOpen ? (
        <section className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] items-end bg-black/70 px-3 pb-3">
          <div className="sheet-up w-full rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface)] p-4">
            <p className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">
              Bildirim erişimi
            </p>
            <h2 className="mt-1 text-[20px] font-extrabold text-[var(--ink-primary)]">
              Mesajları tek panelde toplar
            </h2>
            <p className="mt-2 text-[13px] font-medium leading-5 text-[var(--ink-secondary)]">
              Zimbirti yalnızca seçtiğin uygulamalardan gelen mesaj bildirimlerini
              bu panelde göstermek için bu izni ister. İşlem telefonunun içinde kalır.
            </p>
            <div className="mt-4 space-y-2">
              {[
                "Açılan Android ekranında Zimbirti uygulamasını bul.",
                "Anahtarı aç ve Android uyarısında izin ver.",
                "Yaklaşık birkaç saniye bekle, sonra geri dön.",
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-[14px] bg-[var(--subtle)] p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[12px] font-black text-[#111318]">
                    {index + 1}
                  </span>
                  <p className="text-[13px] font-semibold leading-5 text-[var(--ink-primary)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  trackPermissionExperimentEvent(
                    permissionExperimentVariant,
                    "primer_dismissed",
                  );
                  setIsPermissionPrimerOpen(false);
                }}
                className="tap-target rounded-[var(--radius-btn)] bg-[var(--subtle)] px-3 text-[13px] font-extrabold text-[var(--ink-primary)] transition active:scale-[0.98]"
              >
                Sonra
              </button>
              <button
                type="button"
                onClick={continueFromPermissionPrimer}
                className="tap-target rounded-[var(--radius-btn)] bg-[var(--accent-bg)] px-3 text-[13px] font-extrabold text-[var(--accent-fg)] transition active:scale-[0.98]"
              >
                Devam et
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isBillingSheetOpen || isTrialExpired ? (
        <section className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col justify-end bg-black/70 px-3 pb-3">

          <div className="sheet-up max-h-[88vh] overflow-y-auto rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface)] p-4">

            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">

                <p className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">

                  Google Play aboneliği

                </p>

                <h2 className="mt-1 text-[20px] font-extrabold text-[var(--ink-primary)]">

                  Kullanıma devam et

                </h2>

                <p className="mt-1 text-[13px] font-medium leading-5 text-[var(--ink-secondary)]">

                  {isTrialExpired

                    ? "Mesaj panelini kullanmaya devam etmek için bir süre seç."

                    : "Kullanım süreni Google Play üzerinden yönet."}

                </p>

              </div>

              {!isTrialExpired ? (

                <button

                  type="button"

                  onClick={() => setIsBillingSheetOpen(false)}

                  className="tap-target flex w-11 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-[var(--subtle)] text-[13px] font-extrabold text-[var(--ink-primary)] transition active:scale-[0.97]"

                  aria-label="Kapat"

                >

                  Kapat

                </button>

              ) : null}

            </div>



            <div className="mt-4 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-soft)]">

              {billingPlans.map((plan) => (

                <button

                  key={plan.id}

                  type="button"

                  onClick={() => void purchasePlan(plan.id)}

                  disabled={billingBusyPlan !== null || (isBillingAvailable && plan.available === false)}

                  className="flex min-h-[64px] w-full items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[var(--card)] px-4 py-3 text-left transition last:border-b-0 active:bg-[var(--card-pressed)] disabled:opacity-45"

                >

                  <span className="min-w-0">

                    <span className="block text-[15px] font-extrabold text-[var(--ink-primary)]">

                      {plan.label}

                    </span>

                    <span className="mt-0.5 block text-[12px] font-medium text-[var(--ink-muted)]">

                      {plan.saving}

                    </span>

                  </span>

                  <span className="shrink-0 text-right">

                    <span className="block text-[17px] font-extrabold text-[var(--ink-primary)]">

                      {billingBusyPlan === plan.id ? "..." : plan.price}

                    </span>

                    <span className="mt-0.5 block text-[10px] font-bold uppercase text-[var(--ink-muted)]">

                      {plan.available === false ? "hazır değil" : "satın al"}

                    </span>

                  </span>

                </button>

              ))}

            </div>



            {billingMessage ? (

              <p className="mt-3 rounded-[var(--radius-btn)] bg-[var(--subtle)] px-3 py-2 text-[12px] font-medium leading-5 text-[var(--ink-secondary)]">

                {billingMessage}

              </p>

            ) : null}



            <button

              type="button"

              onClick={() => void restorePurchases()}

              disabled={billingBusyPlan !== null}

              className="tap-target mt-3 flex w-full items-center justify-center rounded-[var(--radius-btn)] border border-[var(--border-strong)] text-[13px] font-extrabold text-[var(--ink-primary)] transition active:bg-[var(--card-pressed)] disabled:opacity-45"

            >

              {billingBusyPlan === "restore" ? "Kontrol ediliyor..." : "Önceki aboneliği kontrol et"}

            </button>

          </div>

        </section>

      ) : null}



      <section className="singlepanel-screen relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden text-white">
        <header className="relative z-20 px-5 pb-4 pt-7">
          <div className="mb-7 flex items-center gap-3">
            <img src="/singlepanel-logo.png" alt="" className="h-[54px] w-[54px] rounded-[16px] shadow-[0_0_28px_rgba(24,119,242,0.22)]" />
            <div className="brand-title text-[28px] font-black leading-none tracking-[-0.02em]">
              <span className="text-white">Single</span><span className="brand-gradient">Panel</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="screen-title text-[34px] font-black tracking-[-0.04em] text-white">
                {activeTab === "messages"
                  ? "Unified Inbox"
                  : activeTab === "contacts"
                    ? "Contacts"
                    : "Settings"}
              </h1>
            </div>
            <div className="flex gap-3 text-white">
              {activeTab === "messages" ? (
                <button className="icon-button transition active:scale-95" aria-label="Ara">
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
                </button>
              ) : null}
              <button
                className="icon-button transition active:scale-95"
                onClick={() => setIsChannelPanelOpen((current) => !current)}
                aria-label="Kanalları ayarla"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              </button>
            </div>
          </div>

          {activeTab === "messages" ? (
          <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedChannelPackage("all")}
              className={`inbox-chip flex h-[46px] shrink-0 items-center justify-center rounded-[16px] px-6 text-[16px] font-bold transition ${
                effectiveSelectedChannelPackage === "all"
                  ? "is-selected text-[#38A3FF]"
                  : "text-[#B9C4DC]"
              }`}
            >
              Hepsi
            </button>
            {enabledChannels.map((channel) => {
              const isSelected = effectiveSelectedChannelPackage === channel.packageName;
              const theme = sourceThemeFor(channel.sourceApp);
              const icon = brandIconFor(channel.sourceApp, channel.packageName);

              let textColor = "text-white";
              if (channel.sourceApp === 'WhatsApp') textColor = "text-[#25D366]";
              else if (channel.sourceApp === 'Instagram') textColor = "text-[#DD2A7B]";
              else if (channel.sourceApp === 'Facebook') textColor = "text-[#1877F2]";

              return (
                <button
                  key={channel.packageName}
                  onClick={() => setSelectedChannelPackage(channel.packageName)}
                  title={sourceDisplayLabel(channel.sourceApp)}
                  className={`inbox-chip flex h-[46px] shrink-0 items-center gap-2.5 rounded-[16px] px-4 text-[16px] font-bold transition ${
                    isSelected ? "is-selected" : ""
                  }`}
                >
                  <span className={`flex h-[24px] w-[24px] items-center justify-center rounded-full ${textColor}`}>
                    {channel.iconBase64 ? (
                      <img src={`data:image/png;base64,${channel.iconBase64}`} alt="" className="h-[24px] w-[24px]" />
                    ) : (
                      <BrandIcon className="h-[24px] w-[24px]" icon={icon} label={theme.label} />
                    )}
                  </span>
                  <span className={textColor}>{channel.label}</span>
                </button>
              );
            })}
          </div>
          ) : null}
        </header>



        <div className="relative z-20 flex-1 overflow-y-auto px-5 pb-28 pt-2">
          {activeTab === "settings" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsChannelPanelOpen(true)}
                className="message-card flex min-h-[86px] w-full items-center justify-between px-4 py-3 text-left transition active:scale-[0.99]"
              >
                <span>
                  <span className="block text-[20px] font-black text-white">Kanalları ayarla</span>
                  <span className="mt-1 block text-[15px] font-medium text-[#B9C4DC]">
                    {enabledChannelCount} açık / {channels.length} kaynak
                  </span>
                </span>
                <span className="channel-chevron">›</span>
              </button>

              <button
                type="button"
                onClick={requestNotificationAccess}
                className="message-card flex min-h-[86px] w-full items-center justify-between px-4 py-3 text-left transition active:scale-[0.99]"
              >
                <span>
                  <span className="block text-[20px] font-black text-white">Bildirim erişimi</span>
                  <span className="mt-1 block text-[15px] font-medium text-[#B9C4DC]">
                    {isNotificationAccessEnabled ? "Açık" : "Mesajların düşmesi için aç"}
                  </span>
                </span>
                <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${isNotificationAccessEnabled ? "bg-[#22C55E] text-white" : "bg-white text-[#111318]"}`}>
                  {isNotificationAccessEnabled ? "Bağlı" : "Aç"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsBillingSheetOpen(true)}
                className="message-card flex min-h-[86px] w-full items-center justify-between px-4 py-3 text-left transition active:scale-[0.99]"
              >
                <span>
                  <span className="block text-[20px] font-black text-white">Hesap durumu</span>
                  <span className="mt-1 block text-[15px] font-medium text-[#B9C4DC]">
                    Kullanım ve abonelik bilgilerini yönet
                  </span>
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#111318]">
                  Yönet
                </span>
              </button>
            </div>
          ) : activeTab === "contacts" ? (
            conversations.length === 0 ? (
              <div className="message-card flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white/8 text-white">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 11a4 4 0 1 0-8 0"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                </div>
                <h2 className="mt-5 text-[18px] font-semibold text-white">Kişi yok</h2>
                <p className="mt-2 max-w-[260px] text-[14px] leading-5 text-[#9CA3AF]">
                  Mesaj geldikçe kişiler otomatik oluşur.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {conversations.map((conversation) => {
                  const theme = sourceThemeFor(conversation.sourceApp);
                  const icon = brandIconFor(conversation.sourceApp, conversation.sourcePackage);

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setActiveTab("messages");
                        setSelectedConversationId(conversation.id);
                      }}
                      className="message-card flex items-center gap-4 p-4 text-left transition active:scale-[0.99]"
                    >
                      <div className={`flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full text-white ${theme.accentClass}`}>
                        <BrandIcon className="h-9 w-9" icon={icon} label={theme.label} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[20px] font-black tracking-[-0.02em] text-white">{conversation.senderName}</div>
                        <div className="mt-0.5 truncate text-[15px] font-medium text-[#B9C4DC]">
                          {conversation.unreadCount} mesaj · {sourceDisplayLabel(conversation.sourceApp)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : visibleConversations.length === 0 ? (
            <div className="space-y-3">
              <div className="message-card flex min-h-[300px] flex-col items-center justify-center px-6 py-9 text-center">
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white/8 text-white">
                <BrandIcon className="h-8 w-8" icon={siGooglemessages} label="MSG" />
              </div>
              <h2 className="mt-5 text-[18px] font-semibold text-white">Okunmamış mesaj yok</h2>
              <p className="mt-2 max-w-[260px] text-[14px] leading-5 text-[#9CA3AF]">
                Yeni müşteri mesajları geldiğinde burada görünür.
              </p>
              </div>

              {!isNotificationAccessEnabled ? (
                <button
                  type="button"
                  onClick={requestNotificationAccess}
                  className="message-card tap-target w-full px-5 py-4 text-left text-white transition active:scale-[0.99]"
                >
                  <span className="block text-[17px] font-black">Bildirim erişimini aç</span>
                  <span className="mt-1 block text-[13px] font-semibold leading-5 text-white/70">
                    Mesajların düşmesi için Android izin ekranına direkt git.
                  </span>
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleConversations.map((conversation) => {
                const message = conversation.latestMessage;
                const theme = sourceThemeFor(conversation.sourceApp);
                const icon = brandIconFor(conversation.sourceApp, conversation.sourcePackage);
                return (
                  <article
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className="message-card relative flex cursor-pointer items-center gap-4 p-4 transition active:scale-[0.99]"
                  >
                    <div className={`flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_0_24px_rgba(255,255,255,0.08)] ${theme.accentClass}`}>
                       <BrandIcon className="h-9 w-9" icon={icon} label={theme.label} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="truncate text-[20px] font-black tracking-[-0.02em] text-white">
                          {message.senderName}
                        </h2>
                        <span className="shrink-0 pt-1 text-[14px] font-semibold text-[#B9C4DC]">
                          {formatDateTime(message.receivedAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-end justify-between gap-3">
                        <p className="line-clamp-2 min-w-0 text-[16px] font-medium leading-6 text-[#B9C4DC]">
                          {message.messageText}
                        </p>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markConversationAsRead(conversation);
                          }}
                          className="shrink-0 rounded-[12px] bg-white px-3 py-1.5 text-[12px] font-black text-[#111318] transition active:scale-95"
                        >
                          Okundu
                        </button>
                      </div>
                      {conversation.unreadCount > 1 ? (
                        <div className={`mt-2 inline-grid h-8 min-w-8 place-items-center rounded-full px-2 text-[15px] font-black text-white ${theme.accentClass}`}>
                          {conversation.unreadCount} mesaj
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <nav className="bottom-nav absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
          <div className="grid grid-cols-3 gap-2">
            {([
              ["messages", "Mesajlar", "M5 12h14M5 7h14M5 17h8"],
              ["contacts", "Kişiler", "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0"],
              ["settings", "Ayarlar", "M12 3v3M12 18v3M4.9 4.9 7.1 7.1m7.1 7.1-7.1-7.1M3 12h3m12 0h3"],
            ] as const).map(([tab, label, path]) => {
              const selected = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedConversationId(null);
                  }}
                  className={`bottom-nav-item flex h-[54px] flex-col items-center justify-center gap-1 rounded-[14px] text-[11px] font-bold transition ${
                    selected ? "is-selected" : "text-[#9CA3AF]"
                  }`}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d={path} />
                  </svg>
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        {selectedConversation ? (
          <section className="singlepanel-screen absolute inset-0 z-40 flex flex-col">
            <header className="flex items-center gap-3 px-5 pb-4 pt-8">
              <button
                type="button"
                onClick={() => setSelectedConversationId(null)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/10 text-white"
                aria-label="Geri"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[20px] font-bold text-white">{selectedConversation.senderName}</h2>
                <p className="text-[13px] text-[#9CA3AF]">
                  {sourceDisplayLabel(selectedConversation.sourceApp)} · {selectedConversation.unreadCount} mesaj
                </p>
              </div>
              <button
                type="button"
                onClick={() => markConversationAsRead(selectedConversation)}
                className="rounded-[10px] bg-white px-3 py-2 text-[12px] font-bold text-[#111318]"
              >
                Okundu
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-6">
              {selectedConversation.messages
                .slice()
                .reverse()
                .map((message) => (
                  <article key={message.id} className="message-card p-4">
                    <div className="mb-2 text-[12px] font-semibold text-[#9CA3AF]">
                      {formatDateTime(message.receivedAt)}
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] leading-6 text-white">
                      {message.messageText}
                    </p>
                  </article>
                ))}
            </div>
          </section>
        ) : null}

      </section>

    </main>

  );

}
