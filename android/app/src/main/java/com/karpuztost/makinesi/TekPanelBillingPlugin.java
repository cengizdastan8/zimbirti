package com.karpuztost.makinesi;

import android.app.Activity;
import android.util.Log;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@CapacitorPlugin(name = "TekPanelBilling")
public class TekPanelBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String TAG = "TekPanelBilling";
    private static final String PRODUCT_ID = "tekpanel_pro";
    private static final String[] BASE_PLAN_IDS = {
            "monthly",
            "quarterly",
            "semiannual",
            "yearly"
    };

    private BillingClient billingClient;
    private boolean isConnecting = false;
    private final Map<String, ProductDetails> productByPlanId = new HashMap<>();
    private final Map<String, ProductDetails.SubscriptionOfferDetails> offerByPlanId = new HashMap<>();

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .enablePendingPurchases(
                        PendingPurchasesParams.newBuilder()
                                .enableOneTimeProducts()
                                .build()
                )
                .enableAutoServiceReconnection()
                .setListener(this)
                .build();
    }

    @PluginMethod
    public void getSubscriptionStatus(PluginCall call) {
        ensureConnected(new BillingReadyCallback() {
            @Override
            public void onReady() {
                resolveStatus(call);
            }

            @Override
            public void onError(String message) {
                JSObject result = baseStatus(false);
                result.put("available", false);
                result.put("message", message);
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String planId = call.getString("planId", "monthly");
        ensureConnected(new BillingReadyCallback() {
            @Override
            public void onReady() {
                ProductDetails productDetails = productByPlanId.get(planId);
                ProductDetails.SubscriptionOfferDetails offerDetails = offerByPlanId.get(planId);
                Activity activity = getActivity();

                if (activity == null) {
                    call.reject("Satinalma ekrani acilamadi.");
                    return;
                }

                if (productDetails == null || offerDetails == null) {
                    call.reject("Bu abonelik plani Google Play'de bulunamadi: " + planId);
                    return;
                }

                BillingFlowParams.ProductDetailsParams productDetailsParams =
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(productDetails)
                                .setOfferToken(offerDetails.getOfferToken())
                                .build();

                BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(Collections.singletonList(productDetailsParams))
                        .build();

                BillingResult result = billingClient.launchBillingFlow(activity, billingFlowParams);
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject(result.getDebugMessage());
                    return;
                }

                JSObject response = new JSObject();
                response.put("started", true);
                response.put("planId", planId);
                call.resolve(response);
            }

            @Override
            public void onError(String message) {
                call.reject(message);
            }
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        ensureConnected(new BillingReadyCallback() {
            @Override
            public void onReady() {
                resolveStatus(call);
            }

            @Override
            public void onError(String message) {
                call.reject(message);
            }
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        JSObject event = new JSObject();
        event.put("responseCode", billingResult.getResponseCode());
        event.put("message", billingResult.getDebugMessage());

        boolean active = false;
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (isActiveTekPanelPurchase(purchase)) {
                    active = true;
                    acknowledgeIfNeeded(purchase);
                }
            }
        }

        event.put("active", active);
        notifyListeners("purchaseUpdated", event);
    }

    private void resolveStatus(PluginCall call) {
        queryPlans(new PlansCallback() {
            @Override
            public void onPlansReady(JSArray plans) {
                queryActivePurchases(new PurchasesCallback() {
                    @Override
                    public void onPurchasesReady(boolean active, Set<String> ownedProducts) {
                        JSObject result = baseStatus(active);
                        result.put("available", true);
                        result.put("plans", plans);
                        result.put("ownedProducts", new JSArray(new ArrayList<>(ownedProducts)));
                        call.resolve(result);
                    }
                });
            }

            @Override
            public void onError(String message) {
                JSObject result = baseStatus(false);
                result.put("available", false);
                result.put("message", message);
                result.put("plans", fallbackPlans());
                call.resolve(result);
            }
        });
    }

    private JSObject baseStatus(boolean active) {
        JSObject result = new JSObject();
        result.put("active", active);
        result.put("productId", PRODUCT_ID);
        return result;
    }

    private void queryPlans(PlansCallback callback) {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, queryProductDetailsResult) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                callback.onError(billingResult.getDebugMessage());
                return;
            }

            productByPlanId.clear();
            offerByPlanId.clear();

            for (ProductDetails details : queryProductDetailsResult.getProductDetailsList()) {
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers == null) {
                    continue;
                }

                for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                    String basePlanId = offer.getBasePlanId();
                    if (!isSupportedPlan(basePlanId)) {
                        continue;
                    }

                    ProductDetails.SubscriptionOfferDetails existing = offerByPlanId.get(basePlanId);
                    if (existing == null || existing.getOfferId() != null) {
                        productByPlanId.put(basePlanId, details);
                        offerByPlanId.put(basePlanId, offer);
                    }
                }
            }

            JSArray plans = new JSArray();
            for (String planId : BASE_PLAN_IDS) {
                ProductDetails productDetails = productByPlanId.get(planId);
                ProductDetails.SubscriptionOfferDetails offerDetails = offerByPlanId.get(planId);
                plans.put(planToJson(planId, productDetails, offerDetails));
            }
            callback.onPlansReady(plans);
        });
    }

    private JSObject planToJson(
            String planId,
            ProductDetails productDetails,
            ProductDetails.SubscriptionOfferDetails offerDetails
    ) {
        JSObject json = fallbackPlan(planId);
        json.put("available", productDetails != null && offerDetails != null);
        json.put("productId", PRODUCT_ID);

        if (productDetails != null) {
            json.put("title", productDetails.getTitle());
            json.put("description", productDetails.getDescription());
        }

        if (offerDetails != null && offerDetails.getPricingPhases() != null) {
            List<ProductDetails.PricingPhase> phases = offerDetails.getPricingPhases().getPricingPhaseList();
            if (!phases.isEmpty()) {
                ProductDetails.PricingPhase phase = phases.get(0);
                json.put("price", phase.getFormattedPrice());
                json.put("billingPeriod", phase.getBillingPeriod());
            }
        }

        return json;
    }

    private void queryActivePurchases(PurchasesCallback callback) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            boolean active = false;
            Set<String> ownedProducts = new HashSet<>();

            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (Purchase purchase : purchases) {
                    if (isActiveTekPanelPurchase(purchase)) {
                        active = true;
                        ownedProducts.addAll(purchase.getProducts());
                        acknowledgeIfNeeded(purchase);
                    }
                }
            }

            callback.onPurchasesReady(active, ownedProducts);
        });
    }

    private boolean isActiveTekPanelPurchase(Purchase purchase) {
        return purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
                && purchase.getProducts().contains(PRODUCT_ID);
    }

    private void acknowledgeIfNeeded(Purchase purchase) {
        if (purchase.isAcknowledged()) {
            return;
        }

        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();

        billingClient.acknowledgePurchase(params, result -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                Log.w(TAG, "acknowledgePurchase failed: " + result.getDebugMessage());
            }
        });
    }

    private void ensureConnected(BillingReadyCallback callback) {
        if (billingClient == null) {
            load();
        }

        if (billingClient.isReady()) {
            callback.onReady();
            return;
        }

        if (isConnecting) {
            getBridge().getActivity().runOnUiThread(() ->
                    getBridge().getActivity().getWindow().getDecorView().postDelayed(
                            () -> ensureConnected(callback),
                            300
                    )
            );
            return;
        }

        isConnecting = true;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                isConnecting = false;
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    callback.onReady();
                } else {
                    callback.onError(billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isConnecting = false;
            }
        });
    }

    private boolean isSupportedPlan(String planId) {
        for (String supported : BASE_PLAN_IDS) {
            if (supported.equals(planId)) {
                return true;
            }
        }
        return false;
    }

    private JSArray fallbackPlans() {
        JSArray plans = new JSArray();
        for (String planId : BASE_PLAN_IDS) {
            JSObject plan = fallbackPlan(planId);
            plan.put("available", false);
            plans.put(plan);
        }
        return plans;
    }

    private JSObject fallbackPlan(String planId) {
        JSObject plan = new JSObject();
        plan.put("id", planId);
        plan.put("productId", PRODUCT_ID);
        plan.put("price", fallbackPrice(planId));
        plan.put("label", fallbackLabel(planId));
        plan.put("saving", fallbackSaving(planId));
        return plan;
    }

    private String fallbackLabel(String planId) {
        switch (planId) {
            case "quarterly":
                return "3 ay";
            case "semiannual":
                return "6 ay";
            case "yearly":
                return "12 ay";
            case "monthly":
            default:
                return "1 ay";
        }
    }

    private String fallbackPrice(String planId) {
        switch (planId) {
            case "quarterly":
                return "$10";
            case "semiannual":
                return "$20";
            case "yearly":
                return "$45";
            case "monthly":
            default:
                return "$5";
        }
    }

    private String fallbackSaving(String planId) {
        switch (planId) {
            case "quarterly":
                return "1 ay avantaj";
            case "semiannual":
                return "2 ay avantaj";
            case "yearly":
                return "3 ay avantaj";
            case "monthly":
            default:
                return "Aylik";
        }
    }

    private interface BillingReadyCallback {
        void onReady();
        void onError(String message);
    }

    private interface PlansCallback {
        void onPlansReady(JSArray plans);
        void onError(String message);
    }

    private interface PurchasesCallback {
        void onPurchasesReady(boolean active, Set<String> ownedProducts);
    }
}
