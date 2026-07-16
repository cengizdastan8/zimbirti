package com.karpuztost.makinesi;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import com.getcapacitor.JSArray;
import java.util.List;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import java.io.ByteArrayOutputStream;

public final class TekPanelChannelStore {
    private static final String PREFS_NAME = "tekpanel_channel_store";
    private static final String KEY_ENABLED_PACKAGES = "enabled_packages";
    private static final String KEY_DISCOVERED = "discovered_packages_v2";

    // Bilinen mesajlasma uygulamalari: ozel kaynak temasi alir ve varsayilan acik gelir.
    private static final Channel[] KNOWN_CHANNELS = new Channel[] {
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
        if (safePackage.isEmpty()) {
            return false;
        }
        return enabledPackages(context).contains(safePackage);
    }

    public static synchronized String sourceAppForPackage(String packageName) {
        String safePackage = safe(packageName);
        for (Channel channel : KNOWN_CHANNELS) {
            if (channel.packageName.equals(safePackage)) {
                return channel.sourceApp;
            }
        }
        // Bilinmeyen uygulamalar genel "Diger" kaynagi olarak gosterilir.
        return safePackage.isEmpty() ? "" : "Diger";
    }

    // Icerikli bildirim gonderen her uygulamayi kanal listesine dusurur.
    public static synchronized void recordDiscoveredPackage(
        Context context,
        String packageName,
        String label
    ) {
        String pkg = safe(packageName);
        if (pkg.isEmpty() || pkg.equals(context.getPackageName()) || isKnownPackage(pkg)) {
            return;
        }

        JSONObject discovered = readDiscovered(context);
        if (discovered.has(pkg)) {
            return;
        }

        try {
            String resolved = (label == null || label.trim().isEmpty())
                ? prettyName(pkg)
                : label.trim();
            discovered.put(pkg, resolved);
            prefs(context).edit().putString(KEY_DISCOVERED, discovered.toString()).apply();
        } catch (JSONException ignored) {
        }
    }

    public static String resolveAppLabel(Context context, String packageName) {
        String pkg = safe(packageName);
        if (pkg.isEmpty()) {
            return "Uygulama";
        }
        try {
            PackageManager packageManager = context.getPackageManager();
            ApplicationInfo info = packageManager.getApplicationInfo(pkg, 0);
            CharSequence label = packageManager.getApplicationLabel(info);
            if (label != null && label.length() > 0) {
                return label.toString();
            }
        } catch (Exception ignored) {
        }
        return prettyName(pkg);
    }

    public static synchronized JSONArray readChannels(Context context) {
        Set<String> enabled = enabledPackages(context);
        JSONArray channels = new JSONArray();
        PackageManager packageManager = context.getPackageManager();
        Set<String> seen = new HashSet<>();

        // Once bilinen, kurulu kanallar.
        for (Channel channel : KNOWN_CHANNELS) {
            if (seen.contains(channel.packageName) || !isInstalled(packageManager, channel.packageName)) {
                continue;
            }
            seen.add(channel.packageName);
            putChannel(context, channels, channel.label, channel.sourceApp, channel.packageName,
                enabled.contains(channel.packageName));
        }

        // Sonra bildirim gondermis bilinmeyen uygulamalar.
        JSONObject discovered = readDiscovered(context);
        Iterator<String> keys = discovered.keys();
        while (keys.hasNext()) {
            String pkg = keys.next();
            if (seen.contains(pkg)) {
                continue;
            }
            seen.add(pkg);
            String label = discovered.optString(pkg, prettyName(pkg));
            putChannel(context, channels, label, "Diger", pkg, enabled.contains(pkg));
        }

        return channels;
    }

    public static synchronized JSONArray scanInstalledChannels(Context context) {
        PackageManager packageManager = context.getPackageManager();
        Intent launcherIntent = new Intent(Intent.ACTION_MAIN);
        launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> apps = packageManager.queryIntentActivities(launcherIntent, 0);

        JSONObject discovered = readDiscovered(context);
        for (ResolveInfo app : apps) {
            if (app == null || app.activityInfo == null) {
                continue;
            }

            String packageName = safe(app.activityInfo.packageName);
            if (packageName.isEmpty()
                    || packageName.equals(context.getPackageName())
                    || isKnownPackage(packageName)
                    || discovered.has(packageName)) {
                continue;
            }

            CharSequence label = app.loadLabel(packageManager);
            try {
                discovered.put(
                        packageName,
                        label == null || label.length() == 0
                                ? prettyName(packageName)
                                : label.toString()
                );
            } catch (JSONException ignored) {
            }
        }

        prefs(context).edit().putString(KEY_DISCOVERED, discovered.toString()).apply();
        return readChannels(context);
    }

    public static synchronized JSONArray saveEnabledPackages(Context context, JSArray packages) {
        JSONArray next = new JSONArray();
        if (packages != null) {
            for (int index = 0; index < packages.length(); index++) {
                String packageName = packages.optString(index, "");
                if (!safe(packageName).isEmpty()) {
                    next.put(packageName);
                }
            }
        }

        prefs(context).edit().putString(KEY_ENABLED_PACKAGES, next.toString()).apply();
        return readChannels(context);
    }

    public static synchronized JSONArray defaultEnabledPackages() {
        // Yalnizca bilinen kanallar varsayilan acik gelir; bilinmeyenleri kullanici acar.
        JSONArray packages = new JSONArray();
        for (Channel channel : KNOWN_CHANNELS) {
            packages.put(channel.packageName);
        }
        return packages;
    }

    private static void putChannel(
        Context context,
        JSONArray channels,
        String label,
        String sourceApp,
        String packageName,
        boolean enabled
    ) {
        JSONObject item = new JSONObject();
        try {
            item.put("label", label);
            item.put("sourceApp", sourceApp);
            item.put("packageName", packageName);
            item.put("installed", true);
            item.put("enabled", enabled);

            String iconBase64 = getBase64Icon(context, packageName);
            if (iconBase64 != null) {
                item.put("iconBase64", iconBase64);
            }

            channels.put(item);
        } catch (JSONException ignored) {
        }
    }

    private static String getBase64Icon(Context context, String packageName) {
        try {
            PackageManager pm = context.getPackageManager();
            Drawable icon = pm.getApplicationIcon(packageName);
            Bitmap bitmap;

            if (icon instanceof BitmapDrawable) {
                bitmap = ((BitmapDrawable) icon).getBitmap();
            } else {
                int width = Math.max(icon.getIntrinsicWidth(), 1);
                int height = Math.max(icon.getIntrinsicHeight(), 1);
                if (width > 128) width = 128;
                if (height > 128) height = 128;

                bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                icon.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                icon.draw(canvas);
            }

            if (bitmap != null) {
                if (bitmap.getWidth() > 128 || bitmap.getHeight() > 128) {
                    bitmap = Bitmap.createScaledBitmap(bitmap, 128, 128, true);
                }
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
                byte[] b = baos.toByteArray();
                return Base64.encodeToString(b, Base64.NO_WRAP);
            }
        } catch (Exception e) {
            // Log or ignore
        }
        return null;
    }

    private static boolean isKnownPackage(String packageName) {
        for (Channel channel : KNOWN_CHANNELS) {
            if (channel.packageName.equals(packageName)) {
                return true;
            }
        }
        return false;
    }

    private static JSONObject readDiscovered(Context context) {
        String raw = prefs(context).getString(KEY_DISCOVERED, "");
        if (raw == null || raw.trim().isEmpty()) {
            return new JSONObject();
        }
        try {
            return new JSONObject(raw);
        } catch (JSONException ignored) {
            return new JSONObject();
        }
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

    private static String prettyName(String packageName) {
        String pkg = safe(packageName);
        if (pkg.isEmpty()) {
            return "Uygulama";
        }
        String[] parts = pkg.split("\\.");
        String last = parts[parts.length - 1];
        if (last.isEmpty()) {
            return pkg;
        }
        return last.substring(0, 1).toUpperCase() + last.substring(1);
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
