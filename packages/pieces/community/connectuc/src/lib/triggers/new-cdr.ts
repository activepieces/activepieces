import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';

export const newCdr = createTrigger({
    auth: connectucAuth,
    name: 'newCdr',
    displayName: 'New CDR',
    description: 'Triggers when a new Call Detail Record (CDR) is created',
    props: {
        users: Property.LongText({
            displayName: 'Users',
            description: 'Add comma-separated users to which this trigger applies',
            required: false,
        }),
    },
    sampleData: {
        id: "17624380791dba1cd5a13fcb8b4c6b66094f564b0fa",
        contactId: null,
        dateTime: "2025-11-06T14:07:59.000Z",
        duration: 8,
        toLabel: "7862881234",
        toNumber: "7862881235",
        recordingId: null,
        origCallid: "8c0spnvbfr8gltgqfseo",
        termCallid: "20251106140759036333-7e6c15a2661d06d7d0281ecd502b4679",
        missed: false,
        direction: "outgoing",
        fromLabel: "Example",
        fromNumber: "17869811611",
        voicemailId: null,
        recordingType: null,
        disposition: null,
        reason: null,
        onnet: 0,
        uid: "3462@example.11111.service"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'CdrCreated',
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
