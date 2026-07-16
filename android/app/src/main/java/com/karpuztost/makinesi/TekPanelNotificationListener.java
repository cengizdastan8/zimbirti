package com.karpuztost.makinesi;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class TekPanelNotificationListener extends NotificationListenerService {
    private static final String TAG = "TekPanelListener";

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "connected");

        StatusBarNotification[] activeNotifications = getActiveNotifications();
        if (activeNotifications == null) {
            return;
        }

        for (StatusBarNotification activeNotification : activeNotifications) {
            processNotification(activeNotification);
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        processNotification(sbn);
    }

    private void processNotification(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) {
            return;
        }

        String packageName = sbn.getPackageName();
        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;
        if (extras == null) {
            TekPanelCaptureStore.recordRejected(this, packageName, "", "", "Bildirim verisi bos");
            return;
        }

        String title = charSequenceToString(extras.getCharSequence(Notification.EXTRA_TITLE));
        String text = charSequenceToString(extras.getCharSequence(Notification.EXTRA_TEXT));
        String bigText = charSequenceToString(extras.getCharSequence(Notification.EXTRA_BIG_TEXT));
        String textLines = textLinesToString(extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES));
        String messageText = firstNonEmpty(bigText, textLines, text);

        TekPanelCaptureStore.recordSeen(this, packageName, title, messageText);

        if (title.trim().isEmpty() && messageText.trim().isEmpty()) {
            TekPanelCaptureStore.recordRejected(this, packageName, title, messageText, "Baslik ve metin bos");
            Log.d(TAG, "rejected empty package=" + packageName);
            return;
        }

        if (isLowSignalNotification(title, messageText)) {
            TekPanelCaptureStore.recordRejected(this, packageName, title, messageText, "Mesaj metni teknik veya anlamsiz");
            Log.d(TAG, "rejected low signal package=" + packageName + " title=" + title);
            return;
        }

        // Icerikli bir bildirim geldi: uygulamayi kanal listesine dusur ki
        // kullanici isterse acabilsin. Bilinen kanallar zaten listede.
        TekPanelChannelStore.recordDiscoveredPackage(
            this,
            packageName,
            TekPanelChannelStore.resolveAppLabel(this, packageName)
        );

        String sourceApp = TekPanelChannelStore.sourceAppForPackage(packageName);

        if (!TekPanelChannelStore.isPackageAllowed(this, packageName)) {
            TekPanelCaptureStore.recordRejected(this, packageName, title, messageText, "Kanal kullanici tarafindan kapali");
            Log.d(TAG, "rejected disabled channel package=" + packageName);
            return;
        }

        String fingerprint = notificationFingerprint(sbn, title, messageText);
        if (TekPanelCaptureStore.hasFingerprint(this, fingerprint)) {
            TekPanelCaptureStore.recordRejected(this, packageName, title, messageText, "Duplicate bildirim");
            Log.d(TAG, "rejected duplicate package=" + packageName);
            return;
        }
        TekPanelCaptureStore.rememberFingerprint(this, fingerprint);

        TekPanelCaptureStore.add(
                this,
                sourceApp,
                packageName,
                title.trim().isEmpty() ? "Yakalanan mesaj" : title,
                messageText,
                java.time.Instant.ofEpochMilli(sbn.getPostTime()).toString(),
                "notification"
        );
        Log.d(TAG, "accepted package=" + packageName + " title=" + title);
    }

    private boolean isLowSignalNotification(String title, String text) {
        String normalized = (safe(title) + " " + safe(text)).trim().toLowerCase();
        if (normalized.isEmpty()) {
            return true;
        }

        String[] blockedFragments = new String[] {
                "checking for new messages",
                "whatsapp web is currently active",
                "backup in progress",
                "syncing",
                "running in the background",
                "bildirim yok",
                "yeni mesajlar kontrol ediliyor",
                "yedekleniyor",
                "senkronize ediliyor",
                "mesaj bekleniyor",
                "bu biraz zaman alabilir",
                "aranıyor",
                "araniyor",
                "cevapsız sesli arama",
                "cevapsiz sesli arama",
                "missed voice call",
                "incoming voice call",
                "calling"
        };

        for (String fragment : blockedFragments) {
            if (normalized.contains(fragment)) {
                return true;
            }
        }
        return false;
    }

    private String notificationFingerprint(StatusBarNotification sbn, String title, String text) {
        String key = sbn.getKey();
        if (key != null && !key.trim().isEmpty()) {
            return safe(sbn.getPackageName()) + "|" + key + "|" + safe(title) + "|" + safe(text);
        }

        return safe(sbn.getPackageName()) + "|" + safe(title) + "|" + safe(text) + "|" + sbn.getPostTime();
    }

    private String textLinesToString(CharSequence[] lines) {
        if (lines == null || lines.length == 0) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (CharSequence line : lines) {
            String text = charSequenceToString(line);
            if (text.isEmpty()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append("\n");
            }
            builder.append(text);
        }
        return builder.toString();
    }

    private String firstNonEmpty(String... values) {
        for (String value : values) {
            if (!safe(value).trim().isEmpty()) {
                return value;
            }
        }
        return "";
    }

    private String charSequenceToString(CharSequence value) {
        return value == null ? "" : value.toString();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
