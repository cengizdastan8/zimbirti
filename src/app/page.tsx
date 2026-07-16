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





function useDominantColors(channels: ChannelSetting[]) {

  const [colors, setColors] = useState<Record<string, string>>({});

  const processed = useRef(new Set<string>());



  useEffect(() => {

    channels.forEach((channel) => {

      if (channel.iconBase64 && !processed.current.has(channel.packageName)) {

        processed.current.add(channel.packageName);

        const img = new Image();

        img.onload = () => {

          const canvas = document.createElement("canvas");

          canvas.width = 1;

          canvas.height = 1;

          const ctx = canvas.getContext("2d");

          if (ctx) {

            ctx.drawImage(img, 0, 0, 1, 1);

            const data = ctx.getImageData(0, 0, 1, 1).data;

            if (data[3] > 0) {

              setColors((prev) => ({

                ...prev,

                [channel.packageName]: `rgb(${data[0]}, ${data[1]}, ${data[2]})`,

              }));

            }

          }

        };

        img.src = `data:image/png;base64,${channel.iconBase64}`;

      }

    });

  }, [channels]);



  return colors;

}



export default function Home() {



  const [messages, setMessages] = useState<InboxMessage[]>([]);

  const [channels, setChannels] = useState<ChannelSetting[]>(fallbackChannels);

  const [isChannelPanelOpen, setIsChannelPanelOpen] = useState(false);

  const dominantColors = useDominantColors(channels);

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



    if (permissionExperimentVariant === "direct") {

      void openNotificationAccess();

      return;

    }



    trackPermissionExperimentEvent(permissionExperimentVariant, "primer_shown");

    setIsPermissionPrimerOpen(true);

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

    if (!isNative) {

      return;

    }



    const closeTopLayerOrStay = () => {

      if (isBillingSheetOpenRef.current) {

        setIsBillingSheetOpen(false);

      } else if (isChannelPanelOpenRef.current) {

        setIsChannelPanelOpen(false);

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

          <div className="channel-sheet mt-auto max-h-[88vh] overflow-hidden rounded-[32px] p-4">

            <div className="flex items-start justify-between gap-3 px-1 pb-4">

              <div className="min-w-0">

                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink-muted)]">SinglePanel</p>

                <h2 className="mt-1 text-[30px] font-black leading-8 tracking-tight text-white">Kanallar</h2>

                <p className="mt-2 text-[14px] font-semibold text-[var(--ink-secondary)]">

                  {enabledChannelCount} açık / {channels.length} kaynak

                </p>

              </div>

              <button

                type="button"

                onClick={() => setIsChannelPanelOpen(false)}

                className="channel-close tap-target flex w-16 shrink-0 items-center justify-center text-[18px] font-bold text-white transition active:scale-[0.97]"

                aria-label="Kapat"

              >

                Kapat

              </button>

            </div>



            <div className="no-scrollbar max-h-[58vh] space-y-3 overflow-y-auto pb-1">

              {channels.length === 0 ? (

                <p className="px-4 py-5 text-[14px] leading-6 text-[var(--ink-secondary)]">

                  Bu telefonda mesaj kanalı bulunamadı.

                </p>

              ) : (

                <>

                  <button

                    type="button"

                    onClick={() => void toggleAllChannels()}

                    className="channel-row flex min-h-[82px] w-full items-center justify-between gap-4 px-4 py-3 text-left transition active:scale-[0.99]"

                    aria-label="Tüm kanalları değiştir"

                    aria-pressed={areAllChannelsEnabled}

                  >

                    <span className="flex min-w-0 items-center gap-4">

                      <span className="channel-all-icon">
                        <span className="channel-all-dot bg-[#ff2e55]" />
                        <span className="channel-all-dot bg-[#1687ff]" />
                        <span className="channel-all-dot bg-[#22c55e]" />
                      </span>

                      <span className="min-w-0">

                      <span className="block text-[21px] font-black leading-6 text-white">

                        Tüm kanallar

                      </span>

                      <span className="mt-1 block text-[15px] font-semibold text-[var(--ink-muted)]">

                        Tek dokunuşla hepsini aç veya kapat

                      </span>

                      </span>

                    </span>

                    <span className="channel-check" data-on={areAllChannelsEnabled}>✓</span>

                  </button>



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

                        <span className="flex min-w-0 items-center gap-4">

                          <span

                            className={`channel-app-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[10px] font-black tracking-[0.08em] ${

                              channel.iconBase64 ? "bg-[var(--card)] text-white" : theme.badgeClass

                            }`}

                          >

                            {channel.iconBase64 ? (

                              // eslint-disable-next-line @next/next/no-img-element

                              <img

                                src={`data:image/png;base64,${channel.iconBase64}`}

                                alt=""

                                className="h-10 w-10 rounded-xl object-contain"

                              />

                            ) : (

                              <BrandIcon

                                className="h-8 w-8"

                                icon={brandIconFor(channel.sourceApp, channel.packageName)}

                                label={theme.label}

                              />

                            )}

                          </span>

                          <span className="block min-w-0">

                            <span className="block truncate text-[21px] font-black leading-6 text-white">

                              {channel.label}

                            </span>

                            <span className="mt-1 block truncate text-[15px] font-semibold text-[var(--ink-muted)]">

                              {channel.enabled ? "Mesajları alıyor" : "Kapalı"}

                            </span>

                          </span>

                        </span>

                        <span className="channel-check" data-on={channel.enabled}>✓</span>

                      </button>

                    );

                  })}

                </>

              )}

            </div>



            <div className="grid gap-3 pt-3">

              <button

                type="button"

                onClick={() => void scanInstalledChannels()}

                className="channel-add tap-target flex w-full items-center justify-between px-5 py-3 text-left text-[18px] font-bold leading-7 text-white transition active:scale-[0.99]"

              >

                Kanal ekle / telefondaki uygulamaları tara

                <span className="text-[18px] leading-none">+</span>

              </button>



              {isNative && !isNotificationAccessEnabled ? (

                <button

                  type="button"

                  onClick={requestNotificationAccess}

                  className="channel-add tap-target px-5 py-3 text-left text-[16px] font-black text-white transition active:scale-[0.99]"

                >

                  Bildirim erişimini aç

                </button>

              ) : null}

              {isNative && !isNotificationAccessEnabled ? (

                <p className="px-1 text-[12px] leading-5 text-[var(--ink-muted)]">

                  Mesajların panele düşmesi için gerekir. İşlem telefonun içinde kalır.

                </p>

              ) : null}

            </div>

          </div>

        </section>

      ) : null}

      {isPermissionPrimerOpen ? (
        <section className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] items-end bg-black/70 px-3 pb-3">
          <div className="sheet-up w-full rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface)] p-4">
            <p className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">
              Bildirim erisimi
            </p>
            <h2 className="mt-1 text-[20px] font-extrabold text-[var(--ink-primary)]">
              Mesajlari tek panelde toplar
            </h2>
            <p className="mt-2 text-[13px] font-medium leading-5 text-[var(--ink-secondary)]">
              Android bir sonraki ekranda guclu bir uyari gosterecek. Bu normal.
              Zimbirti, mesaj bildirimlerini panelde gostermek icin bu izni ister.
            </p>
            <p className="mt-2 text-[12px] font-medium leading-5 text-[var(--ink-muted)]">
              Mesajlar cihazinda islenir. Bu ekrandan devam edince telefonun
              bildirim erisimi ayari acilir.
            </p>
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

                    ? "3 günlük deneme bitti. Devam etmek için kullanım süreni seç."

                    : "Kullanım süreni seç ve Google Play üzerinden devam et."}

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

              {billingBusyPlan === "restore" ? "Kontrol ediliyor..." : "Satın almayı geri yükle"}

            </button>

          </div>

        </section>

      ) : null}



      <section className="singlepanel-screen relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden text-white">
        <div className="neon-arc neon-arc-pink" aria-hidden="true" />
        <div className="neon-arc neon-arc-green" aria-hidden="true" />
        <div className="neon-arc neon-arc-blue" aria-hidden="true" />

                <header className="relative z-20 px-5 pb-4 pt-8">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-[34px] font-bold tracking-tight text-white">
                Unified Inbox
              </h1>
            </div>
            <div className="flex gap-4 text-white">
              <button className="tap-target transition active:scale-95" aria-label="Arama">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
              <button
                className="tap-target transition active:scale-95"
                onClick={() => setIsChannelPanelOpen((current) => !current)}
                aria-label="Filtrele"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              </button>
            </div>
          </div>

          <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedChannelPackage("all")}
              className={`flex h-[42px] shrink-0 items-center justify-center rounded-[12px] px-6 text-[15px] font-semibold transition ${
                effectiveSelectedChannelPackage === "all"
                  ? "bg-[#1E3A8A] text-[#60A5FA]"
                  : "bg-[#1A1C23] text-[#9CA3AF]"
              }`}
            >
              All
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
                  className={`flex h-[42px] shrink-0 items-center gap-2.5 rounded-[12px] px-4 text-[15px] font-semibold transition bg-[#1A1C23] ${
                    isSelected ? "ring-1 ring-white/20" : ""
                  }`}
                >
                  <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${textColor}`}>
                    {channel.iconBase64 ? (
                      <img src={`data:image/png;base64,${channel.iconBase64}`} alt="" className="h-[18px] w-[18px]" />
                    ) : (
                      <BrandIcon className="h-[18px] w-[18px]" icon={icon} label={theme.label} />
                    )}
                  </span>
                  <span className={textColor}>{channel.label}</span>
                </button>
              );
            })}
          </div>
        </header>



                <div className="relative z-20 flex-1 overflow-y-auto px-5 pb-8 pt-2">
          {visibleMessages.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[18px] border border-white/8 bg-[#1A1C23] px-6 py-10 text-center">
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white/8 text-white">
                <BrandIcon className="h-8 w-8" icon={siGooglemessages} label="MSG" />
              </div>
              <h2 className="mt-5 text-[18px] font-semibold text-white">Okunmamis mesaj yok</h2>
              <p className="mt-2 max-w-[260px] text-[14px] leading-5 text-[#9CA3AF]">
                Yeni musteri mesajlari geldiginde burada gorunur.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleMessages.map((message) => {
                const theme = sourceThemeFor(message.sourceApp);
                const icon = brandIconFor(message.sourceApp, message.sourcePackage);
                return (
                  <article
                    key={message.id}
                    className="relative flex items-start gap-4 p-4 bg-[#1A1C23] rounded-[18px]"
                  >
                    <div className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white ${theme.accentClass}`}>
                       <BrandIcon className="h-7 w-7" icon={icon} label={theme.label} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="truncate text-[16px] font-semibold text-white">
                          {message.senderName}
                        </h2>
                        <span className="shrink-0 text-[13px] text-[#9CA3AF]">
                          {formatDateTime(message.receivedAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-end justify-between gap-3">
                        <p className="line-clamp-2 min-w-0 text-[14px] leading-5 text-[#9CA3AF]">
                          {message.messageText}
                        </p>

                        <button
                          type="button"
                          onClick={() => markAsRead(message.id)}
                          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#111318] transition active:scale-95"
                        >
                          Okundu
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

      </section>

    </main>

  );

}
