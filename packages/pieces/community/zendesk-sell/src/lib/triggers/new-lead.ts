import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';

export const newLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Fires when a new lead is created.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "id": 12345,
        "creator_id": 987,
        "owner_id": 987,
        "first_name": "John",
        "last_name": "Appleseed",
        "organization_name": "Apple Inc.",
        "status": "New",
        "source_id": 10,
        "address": {
            "line1": "1 Infinite Loop",
            "city": "Cupertino",
            "state": "CA",
        },
        "created_at": "2025-10-17T13:30:00Z",
    },
    

    async onEnable(context) {
        return;
    },

    async onDisable(context) {
        return;
    },


    async run(context) {
        const payload = context.payload.body as { data: unknown };
        return [payload.data];
    },
});