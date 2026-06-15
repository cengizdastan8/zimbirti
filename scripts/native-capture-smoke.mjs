import { readFileSync } from "node:fs";

const listener = readFileSync(
  "android/app/src/main/java/com/tekpanel/app/TekPanelNotificationListener.java",
  "utf8",
);
const store = readFileSync(
  "android/app/src/main/java/com/tekpanel/app/TekPanelCaptureStore.java",
  "utf8",
);
const plugin = readFileSync(
  "android/app/src/main/java/com/tekpanel/app/TekPanelInboxPlugin.java",
  "utf8",
);
const channelStore = readFileSync(
  "android/app/src/main/java/com/tekpanel/app/TekPanelChannelStore.java",
  "utf8",
);
const mainActivity = readFileSync(
  "android/app/src/main/java/com/tekpanel/app/MainActivity.java",
  "utf8",
);
const manifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");

const requiredPackages = [
  "com.whatsapp",
  "com.whatsapp.w4b",
  "com.instagram.android",
  "com.zhiliaoapp.musically",
  "com.ss.android.ugc.trill",
  "com.twitter.android",
  "com.x.android",
  "com.facebook.orca",
  "com.facebook.katana",
  "com.facebook.pages.app",
  "com.google.android.apps.messaging",
  "com.samsung.android.messaging",
  "com.android.mms",
  "com.miui.mms",
];

const checks = {
  actionSendShare: mainActivity.includes("Intent.ACTION_SEND") && mainActivity.includes('"share"'),
  allowlistPackages: requiredPackages.every((packageName) => channelStore.includes(packageName)),
  manifestQueries: requiredPackages.every((packageName) => manifest.includes(packageName)),
  channelStore:
    channelStore.includes("readChannels") &&
    channelStore.includes("saveEnabledPackages") &&
    channelStore.includes("isPackageAllowed"),
  channelBridge:
    plugin.includes("readChannelSettings") &&
    plugin.includes("saveEnabledChannels"),
  listenerUsesChannelFilter:
    listener.includes("TekPanelChannelStore.sourceAppForPackage") &&
    listener.includes("TekPanelChannelStore.isPackageAllowed") &&
    listener.includes("Kanal kullanici tarafindan kapali"),
  duplicateGuard:
    listener.includes("notificationFingerprint") &&
    listener.includes("hasFingerprint") &&
    listener.includes("rememberFingerprint"),
  rejectsOutsideAllowlist:
    listener.includes("Paket allowlist disinda") &&
    listener.includes("recordRejected"),
  textLines:
    listener.includes("Notification.EXTRA_TEXT_LINES") &&
    listener.includes("textLinesToString"),
  diagnosticsStore:
    store.includes("KEY_DIAGNOSTICS") &&
    store.includes("lastDecision") &&
    store.includes("lastRejectReason") &&
    store.includes("queueCount") &&
    store.includes("lastImportAt"),
  queueOnlyAccepted:
    store.includes("KEY_MESSAGES") &&
    listener.includes("TekPanelCaptureStore.add") &&
    listener.includes("sourceApp.isEmpty()"),
  activeImportOnConnect:
    listener.includes("onListenerConnected") &&
    listener.includes("getActiveNotifications") &&
    listener.includes("processNotification(activeNotification)"),
  bridgeDiagnostics:
    plugin.includes("readDiagnostics") &&
    plugin.includes("openNotificationAccessSettings"),
  bridgeRebind:
    plugin.includes("requestNotificationListenerRebind") &&
    plugin.includes("NotificationListenerService.requestRebind"),
};

const failed = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const result = {
  checks,
  requiredPackages,
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  throw new Error(`Native capture smoke failed: ${failed.join(", ")}`);
}
