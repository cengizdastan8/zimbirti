package com.tekpanel.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TekPanelInboxPlugin.class);
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return;
        }

        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) {
            return;
        }

        CharSequence sharedText = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (sharedText == null) {
            sharedText = intent.getCharSequenceExtra(Intent.EXTRA_TITLE);
        }

        TekPanelCaptureStore.add(
                this,
                "Diger",
                sourcePackageFromShare(intent),
                "Paylasilan metin",
                sharedText == null ? "" : sharedText.toString(),
                "share"
        );
    }

    private String sourcePackageFromShare(Intent intent) {
        Uri referrer = getReferrer();
        if (referrer != null && referrer.getHost() != null) {
            return referrer.getHost();
        }
        return safe(intent.getPackage());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
