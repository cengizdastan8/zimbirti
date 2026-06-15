package com.tekpanel.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import com.getcapacitor.JSArray;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class TekPanelChannelStore {
    private static final String PREFS_NAME = "tekpanel_channel_store";
    private static final String KEY_ENABLED_PACKAGES = "enabled_packages";

    private static final Channel[] CHANNELS = new Channel[] {
            new Channel("WhatsApp", "WhatsApp", "com.whatsapp"),
            new Channel("WhatsApp Business", "WhatsApp", "com.whatsapp.w4b"),
            new Channel("Instagram", "Instagram", "com.instagram.android"),
            new Channel("TikTok", "TikTok", "com.zhiliaoapp.musically"),
            new Channel("TikTok", "TikTok", "com.ss.android.ugc.trill"),
            new Channel("X / Twitter", "X / Twitter", "com.twitter.android"),
            new Channel("X", "X / Twitter", "com.x.android"),
            new Channel("Messenger", "Facebook", "com.facebook.orca"),
            new Channel("Facebook", "Facebook", "com.facebook.katana"),
            new Channel("Facebook Pages", "Facebook", "com.facebook.pages.app"),
            new Channel("Google Mesajlar", "SMS", "com.google.android.apps.messaging"),
            new Channel("Samsung Mesajlar", "SMS", "com.samsung.android.messaging"),
            new Channel("Android SMS", "SMS", "com.android.mms"),
            new Channel("MIUI SMS", "SMS", "com.miui.mms")
    };

    private TekPanelChannelStore() {}

    public static synchronized boolean isPackageAllowed(Context context, String packageName) {
        String safePackage = safe(packageName);
        if (safePackage.isEmpty() || sourceAppForPackage(safePackage).isEmpty()) {
            return false;
        }

        return enabledPackages(context).contains(safePackage);
    }

    public static synchronized String sourceAppForPackage(String packageName) {
        String safePackage = safe(packageName);
        for (Channel channel : CHANNELS) {
            if (channel.packageName.equals(safePackage)) {
                return channel.sourceApp;
            }
        }
        return "";
    }

    public static synchronized JSONArray readChannels(Context context) {
        Set<String> enabled = enabledPackages(context);
        JSONArray channels = new JSONArray();
        PackageManager packageManager = context.getPackageManager();

        for (Channel channel : CHANNELS) {
            boolean installed = isInstalled(packageManager, channel.packageName);
            if (!installed) {
                continue;
            }

            JSONObject item = new JSONObject();
            try {
                item.put("label", channel.label);
                item.put("sourceApp", channel.sourceApp);
                item.put("packageName", channel.packageName);
                item.put("installed", true);
                item.put("enabled", enabled.contains(channel.packageName));
                channels.put(item);
            } catch (JSONException ignored) {
            }
        }

        return channels;
    }

    public static synchronized JSONArray saveEnabledPackages(Context context, JSArray packages) {
        JSONArray next = new JSONArray();
        if (packages != null) {
            for (int index = 0; index < packages.length(); index++) {
                String packageName = packages.optString(index, "");
                if (!sourceAppForPackage(packageName).isEmpty()) {
                    next.put(packageName);
                }
            }
        }

        prefs(context).edit().putString(KEY_ENABLED_PACKAGES, next.toString()).apply();
        return readChannels(context);
    }

    public static synchronized JSONArray defaultEnabledPackages() {
        JSONArray packages = new JSONArray();
        for (Channel channel : CHANNELS) {
            packages.put(channel.packageName);
        }
        return packages;
    }

    private static Set<String> enabledPackages(Context context) {
        JSONArray raw = readEnabledPackages(context);
        Set<String> packages = new HashSet<>();
        for (int index = 0; index < raw.length(); index++) {
            String packageName = raw.optString(index, "");
            if (!packageName.isEmpty()) {
                packages.add(packageName);
            }
        }
        return packages;
    }

    private static JSONArray readEnabledPackages(Context context) {
        String raw = prefs(context).getString(KEY_ENABLED_PACKAGES, "");
        if (raw == null || raw.trim().isEmpty()) {
            return defaultEnabledPackages();
        }

        try {
            return new JSONArray(raw);
        } catch (JSONException ignored) {
            return defaultEnabledPackages();
        }
    }

    private static boolean isInstalled(PackageManager packageManager, String packageName) {
        try {
            packageManager.getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException ignored) {
            return false;
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static final class Channel {
        private final String label;
        private final String sourceApp;
        private final String packageName;

        private Channel(String label, String sourceApp, String packageName) {
            this.label = label;
            this.sourceApp = sourceApp;
            this.packageName = packageName;
        }
    }
}
