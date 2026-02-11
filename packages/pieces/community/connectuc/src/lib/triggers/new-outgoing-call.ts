import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';

export const newOutgoingCall = createTrigger({
    auth: connectucAuth,
    name: 'newOutgoingCall',
    displayName: 'New Outgoing Call',
    description: 'Triggers when a new outgoing call is initiated',
    props: {
        users: Property.LongText({
            displayName: 'Users',
            description: 'Add comma-separated users to which this trigger applies',
            required: false,
        }),
    },
    sampleData: {
        orig_callid: "cb4542b9-34ff-123f-9192-005056842248",
        term_callid: "20251105153444016549-7e6c15a2661d06d7d0281ecd502b4679",
        caller_id: "3462",
        caller_name: "John Doe",
        time_start: "2025-11-05T15:34:44.000Z",
        to: "17862881234",
        direction: "outgoing",
        term_to_uri: "sip:17862811234@example.11111.service",
        from: "3462",
        device: "3462w"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'NewOutgoingCall',
            context,
        });
    },
    async onDisable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await unregisterConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            context,
        });
    },
    async run(context){
        return [context.payload.body]
    }
})
