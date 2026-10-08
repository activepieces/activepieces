import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeWebhook } from '../common/webhook';
import { saleSample } from '../common/samples';
import { saleTriggerOutputSchema } from '../output-schemas';

export const newSale = createTrigger({
    auth: systemeIoAuth,
    name: 'newSale',
    classification: 'READ',
    displayName: 'New Sale',
    description: 'Fires when a new purchase is made within a funnel',
    aiMetadata: {
      description: 'Fires when a new sale (purchase) is completed within a Systeme.io funnel, delivering the customer (email, contact id, form fields), order, order item resources, price plan, funnel step and any coupon. Use to react to new orders or revenue events; use Sale Canceled for refunds and subscription cancellations.',
    },
    props: {},
    sampleData: saleSample,
    outputSchema: saleTriggerOutputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await systemeWebhook.enable({
            auth: context.auth,
            webhookUrl: context.webhookUrl,
            store: context.store,
            event: 'SALE_NEW',
            prefix: 'new_sale',
        });
    },
    async onDisable(context) {
        await systemeWebhook.disable({ auth: context.auth, store: context.store, prefix: 'new_sale' });
    },
    async run(context) {
        if (!(await systemeWebhook.accept({ store: context.store, payload: context.payload, prefix: 'new_sale' }))) {
            return [];
        }

        return [systemeWebhook.unwrap({ body: context.payload.body, key: 'sale' })];
    }
});
