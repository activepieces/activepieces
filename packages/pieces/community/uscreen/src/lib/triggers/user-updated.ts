

import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { uscreenAuth } from "../common/auth";


const sampleData = {
  "id": 123456,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "custom_fields": {
    "favorite_genre": "Documentary",
    "comments": "Updated mobile phone"
  },
  "origin": "website",
  "event": "user_updated"
};

export const userUpdated = createTrigger({
    auth: uscreenAuth,
    name: 'user_updated',
    displayName: 'User Updated',
    description: 'Fires when a user’s profile or information is updated. You must manually add the webhook URL from ActivePieces into your Uscreen settings: Settings > Webhooks > New Webhook and select the "User Updated" event.',
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        return;
    },

    async onDisable(context) {
        return;
    },

    async run(context) {
        const payload = context.payload as unknown as (typeof sampleData);
        
        if (payload.event !== "user_updated") {
            return [];
        }
        
        return [payload];
    },

    async test(context) {
        return [sampleData];
    }
});