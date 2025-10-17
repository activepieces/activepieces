import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';

export const newContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_contact',
    displayName: 'New Contact',
    description: 'Fires when a new contact is created in Zendesk Sell.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "id": 12345,
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@example.com",
        "phone": "555-123-4567",
        "organization_name": "ABC Corp",
        "created_at": "2025-10-17T19:04:00Z",
        "updated_at": "2025-10-17T19:04:00Z"
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