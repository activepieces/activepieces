import { createTrigger, PieceAuth, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { humanbotCommon, polling } from '../common';

export const chatsEmailCompletedTrigger = createTrigger({
    auth: PieceAuth.None(),
    name: 'chats_email_completed_trigger', // Unique name across the piece.
    displayName: 'Chat Completed With Email Address', // Display name on the interface.
    description: 'Triggers when any chat was completed but with the received client email.', // Description for the action
    props: {
        api_key: humanbotCommon.propApiKey
    }, // Required properties from the user.
    sampleData: [
        {
            "id": 1,
            "createdDate": "2023-10-17 12:16:07",
            "customerAvatar": "",
            "customerName": "Tester",
            "customerEmail": "qwer@qwer.ty",
            "customerPhone": "456-456",
            "customerLocation": "",
            "customerDate": "12 September 2023.",
            "customerTime": "",
            "street": "",
            "city": "",
            "state": "",
            "zip": "",
            "custom1": "",
            "custom2": "",
            "custom3": "",
            "custom4": "",
            "custom5": "",
            "campaignTitle": "Appointment Booking"
        }
    ],
    type: TriggerStrategy.POLLING,
    async test(ctx) {
        return await pollingHelper.test(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: Object.assign(ctx.propsValue, {type: 'chats_email_latest'})
        });
    },
    async onEnable(ctx) {
        await pollingHelper.onEnable(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: Object.assign(ctx.propsValue, {type: 'chats_email_latest'})
        });
    },
    async onDisable(ctx) {
        await pollingHelper.onDisable(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: Object.assign(ctx.propsValue, {type: 'chats_email_latest'})
        });
    },
    async run(ctx) {
        return await pollingHelper.poll(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: Object.assign(ctx.propsValue, {type: 'chats_email_latest'})
        });
    }
});
