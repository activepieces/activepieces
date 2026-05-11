import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';
import { domainProp, usersProp } from '../common/props';

export const newCallSummary = createTrigger({
    auth: connectucAuth,
    name: 'newCallSummary',
    displayName: 'New Call Summary',
    description: 'Triggers when a new call summary is created',
    props: {
        domain: domainProp(),
        users: usersProp(),
    },
    sampleData: {
        "callId":"233dbsj3mssskjkk22",
        "summary":"test summary",
        "date": "2026-04-01"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'NewCallSummary',
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
