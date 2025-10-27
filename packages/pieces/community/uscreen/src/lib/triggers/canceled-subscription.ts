

import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { uscreenAuth } from "../common/auth";

const sampleData = {
  "event": "subscription_canceled",
  "user_id": 123456,
  "user_email": "user@example.com",
  "subscription_id": "sub_789xyz",
  "subscription_title": "Premium Plan",
  "canceled_at": "2025-10-27T13:32:10Z",
  "custom_fields": {
    "favorite_genre": "Comedy",
    "referral_source": "Google Ads"
  }
};

export const canceledSubscription = createTrigger({
    auth: uscreenAuth,
    name: 'canceled_subscription',
    displayName: 'Canceled Subscription',
    description: 'Fires when a subscription is canceled for a user. You must manually add the webhook URL from ActivePieces into your Uscreen settings: Settings > Webhooks > New Webhook and select the "Canceled Subscription" event.',
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        return;
    },

    async onDisable(context) {
        return;
    },

    // 'run' is called when Uscreen sends a payload to the webhook URL
    async run(context) {
        const payload = context.payload as unknown as (typeof sampleData);
        
        // We only care about the 'subscription_canceled' event
        if (payload.event !== "subscription_canceled") {
            return [];
        }
        
        // Return the payload in an array
        return [payload];
    },

    // 'test' just returns the sample data for the UI
    async test(context) {
        return [sampleData];
    }
});