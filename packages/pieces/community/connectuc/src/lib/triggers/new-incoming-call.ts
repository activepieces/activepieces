import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';
import { domainProp, usersProp } from '../common/props';

export const newIncomingCall = createTrigger({
    auth: connectucAuth,
    name: 'newIncomingCall',
    displayName: 'New Incoming Call',
    description: 'Triggers when a new incoming call is received',
    props: {
        domain: domainProp(),
        users: usersProp(),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter by call status',
            required: false,
            options: {
                options: [
                    { label: 'Ringing', value: 'ringing' },
                    { label: 'Answered', value: 'answered' },
                    { label: 'Both', value: 'both' },
                ],
            },
            defaultValue: 'answered',
        }),
    },
    sampleData: {
        orig_callid: "cb4542b9-34ff-123f-9192-005056842248",
        term_callid: "20251105153444016549-7e6c15a2661d06d7d0281ecd502b4679",
        caller_id: "17862881234",
        caller_name: "+17862881234",
        time_start: "2025-11-05T15:34:44.000Z",
        to: "3462",
        status: "ringing",
        term_to_uri: "sip:3462w@example.11111.service",
        from: "17862911234",
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
            event: 'NewIncomingCall',
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
