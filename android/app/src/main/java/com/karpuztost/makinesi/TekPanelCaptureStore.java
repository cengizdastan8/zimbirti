package com.karpuztost.makinesi;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class TekPanelCaptureStore {
    private static final String PREFS_NAME = "tekpanel_capture_store";
    private static final String KEY_MESSAGES = "messages";
    private static final String KEY_DIAGNOSTICS = "diagnostics";
    private static final String KEY_FINGERPRINTS = "fingerprints";
    private static final int MAX_MESSAGES = 300;
    private static final int MAX_FINGERPRINTS = 120;

    private TekPanelCaptureStore() {}

    public static synchronized boolean hasFingerprint(Context context, String fingerprint) {
        String safeFingerprint = safe(fingerprint);
        if (safeFingerprint.isEmpty()) {
            return false;
        }

        JSONArray fingerprints = readJsonArray(context, KEY_FINGERPRINTS);
        for (int index = 0; index < fingerprints.length(); index++) {
            if (safeFingerprint.equals(fingerprints.optString(index))) {
                return true;
            }
        }
        return false;
    }

    public static synchronized void rememberFingerprint(Context context, String fingerprint) {
        String safeFingerprint = safe(fingerprint);
        if (safeFingerprint.isEmpty()) {
            return;
        }

        JSONArray fingerprints = readJsonArray(context, KEY_FINGERPRINTS);
        JSONArray next = new JSONArray();
        int start = Math.max(0, fingerprints.length() - MAX_FINGERPRINTS + 1);
        for (int index = start; index < fingerprints.length(); index++) {
            String value = fingerprints.optString(index);
            if (!safeFingerprint.equals(value)) {
                next.put(value);
            }
        }
        next.put(safeFingerprint);
        writeArray(context, KEY_FINGERPRINTS, next);
    }

    public static synchronized void add(
            Context context,
            String sourceApp,
            String sourcePackage,
            String senderName,
            String messageText,
            String receivedAt,
            String captureMethod
    ) {
        String text = safe(messageText).trim();
        if (text.isEmpty()) {
            return;
        }

        JSONArray messages = readJsonArray(context, KEY_MESSAGES);
        JSONObject message = new JSONObject();
        try {
            message.put("id", UUID.randomUUID().toString());
            message.put("sourceApp", safe(sourceApp).isEmpty() ? "Diger" : sourceApp);
            message.put("sourcePackage", safe(sourcePackage));
            message.put("senderName", safe(senderName).isEmpty() ? "Yakalanan mesaj" : senderName);
            message.put("messageText", text);
            message.put("receivedAt", safe(receivedAt).isEmpty() ? java.time.Instant.now().toString() : receivedAt);
            message.put("captureMethod", captureMethod);
            messages.put(message);
            writeArray(context, KEY_MESSAGES, trim(messages, MAX_MESSAGES));
            writeDiagnostics(context, diagnosticsForAccept(context, message));
        } catch (JSONException ignored) {
        }
    }

    public static synchronized void add(
            Context context,
            String sourceApp,
            String sourcePackage,
            String senderName,
            String messageText,
            String captureMethod
    ) {
        add(context, sourceApp, sourcePackage, senderName, messageText, java.time.Instant.now().toString(), captureMethod);
    }

    public static synchronized JSONArray read(Context context) {
        return readJsonArray(context, KEY_MESSAGES);
    }

    public static synchronized void clear(Context context) {
        prefs(context).edit().remove(KEY_MESSAGES).apply();
        updateImportTime(context);
    }

    public static synchronized JSONObject readDiagnostics(Context context) {
        JSONObject diagnostics = readJsonObject(context, KEY_DIAGNOSTICS);
        try {
            diagnostics.put("queueCount", read(context).length());
        } catch (JSONException ignored) {
        }
        return diagnostics;
    }

    public static synchronized void recordSeen(
            Context context,
            String sourcePackage,
            String title,
            String text
    ) {
        JSONObject diagnostics = readDiagnostics(context);
        try {
            diagnostics.put("lastSeenAt", java.time.Instant.now().toString());
            diagnostics.put("lastSeenPackage", safe(sourcePackage));
            diagnostics.put("lastSeenTitle", safe(title));
            diagnostics.put("lastSeenText", safe(text));
            diagnostics.put("queueCount", read(context).length());
            writeDiagnostics(context, diagnostics);
        } catch (JSONException ignored) {
        }
    }

    public static synchronized void recordRejected(
            Context context,
            String sourcePackage,
            String title,
            String text,
            String reason
    ) {
        JSONObject diagnostics = readDiagnostics(context);
        try {
            diagnostics.put("lastSeenAt", java.time.Instant.now().toString());
            diagnostics.put("lastSeenPackage", safe(sourcePackage));
            diagnostics.put("lastSeenTitle", safe(title));
            diagnostics.put("lastSeenText", safe(text));
            diagnostics.put("lastDecision", "rejected");
            diagnostics.put("lastRejectReason", safe(reason));
            diagnostics.put("lastRejectedAt", java.time.Instant.now().toString());
            diagnostics.put("queueCount", read(context).length());
            writeDiagnostics(context, diagnostics);
        } catch (JSONException ignored) {
        }
    }

    private static JSONObject diagnosticsForAccept(Context context, JSONObject message) throws JSONException {
        JSONObject diagnostics = readDiagnostics(context);
        diagnostics.put("lastDecision", "accepted");
        diagnostics.put("lastRejectReason", "");
        diagnostics.put("lastAcceptedAt", java.time.Instant.now().toString());
        diagnostics.put("lastAcceptedMessage", message);
        diagnostics.put("queueCount", read(context).length());
        return diagnostics;
    }

    private static void updateImportTime(Context context) {
        JSONObject diagnostics = readDiagnostics(context);
        try {
            diagnostics.put("lastImportAt", java.time.Instant.now().toString());
            diagnostics.put("queueCount", read(context).length());
            writeDiagnostics(context, diagnostics);
        } catch (JSONException ignored) {
        }
    }

    private static JSONArray readJsonArray(Context context, String key) {
        String raw = prefs(context).getString(key, "[]");
        try {
            return new JSONArray(raw);
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static JSONObject readJsonObject(Context context, String key) {
        String raw = prefs(context).getString(key, "{}");
        try {
            return new JSONObject(raw);
        } catch (JSONException ignored) {
            return new JSONObject();
        }
    }

    private static void writeArray(Context context, String key, JSONArray messages) {
        prefs(context).edit().putString(key, messages.toString()).apply();
    }

    private static void writeDiagnostics(Context context, JSONObject diagnostics) {
        prefs(context).edit().putString(KEY_DIAGNOSTICS, diagnostics.toString()).apply();
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static JSONArray trim(JSONArray messages, int maxItems) throws JSONException {
        if (messages.length() <= maxItems) {
            return messages;
        }

        JSONArray trimmed = new JSONArray();
        int start = messages.length() - maxItems;
        for (int index = start; index < messages.length(); index++) {
            trimmed.put(messages.get(index));
        }
        return trimmed;
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}
