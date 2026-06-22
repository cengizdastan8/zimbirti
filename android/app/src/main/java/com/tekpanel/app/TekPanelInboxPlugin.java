package com.tekpanel.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.text.TextUtils;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "TekPanelInbox")
public class TekPanelInboxPlugin extends Plugin {
    private static final String TAG = "TekPanelInbox";

    @PluginMethod
    public void readCapturedMessages(PluginCall call) {
        JSONArray messages = TekPanelCaptureStore.read(getContext());
        JSObject result = new JSObject();
        result.put("messages", messages);
        Log.d(TAG, "readCapturedMessages count=" + messages.length());
        call.resolve(result);
    }

    @PluginMethod
    public void clearCapturedMessages(PluginCall call) {
        Log.d(TAG, "clearCapturedMessages");
        TekPanelCaptureStore.clear(getContext());
        call.resolve();
    }

    @PluginMethod
    public void readChannelSettings(PluginCall call) {
        JSONArray channels = TekPanelChannelStore.readChannels(getContext());
        JSObject result = new JSObject();
        result.put("channels", channels);
        call.resolve(result);
    }

    @PluginMethod
    public void saveEnabledChannels(PluginCall call) {
        JSArray packages = call.getArray("packages", new JSArray());
        JSONArray channels = TekPanelChannelStore.saveEnabledPackages(getContext(), packages);
        JSObject result = new JSObject();
        result.put("channels", channels);
        call.resolve(result);
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        openNotificationAccessSettings(call);
    }

    @PluginMethod
    public void isNotificationAccessEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", isNotificationListenerEnabled(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void readDiagnostics(PluginCall call) {
        JSONObject diagnostics = TekPanelCaptureStore.readDiagnostics(getContext());
        try {
            call.resolve(JSObject.fromJSONObject(diagnostics));
        } catch (JSONException exception) {
            call.resolve(new JSObject());
        }
    }

    @PluginMethod
    public void requestNotificationListenerRebind(PluginCall call) {
        NotificationListenerService.requestRebind(listenerComponent(getContext()));
        call.resolve();
    }

    private boolean isNotificationListenerEnabled(Context context) {
        String enabledListeners = Settings.Secure.getString(
                context.getContentResolver(),
                "enabled_notification_listeners"
        );

        if (TextUtils.isEmpty(enabledListeners)) {
            return false;
        }

        ComponentName expected = listenerComponent(context);
        String[] listeners = enabledListeners.split(":");
        for (String listener : listeners) {
            ComponentName actual = ComponentName.unflattenFromString(listener);
            if (expected.equals(actual)) {
                return true;
            }
        }
        return false;
    }

    private ComponentName listenerComponent(Context context) {
        return new ComponentName(context, TekPanelNotificationListener.class);
    }
}
