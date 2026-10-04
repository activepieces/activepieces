import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeWebhook } from '../common/webhook';
import { contactSample } from '../common/samples';
import { newContactTriggerOutputSchema } from '../output-schemas';

export const newContact = createTrigger({
    auth: systemeIoAuth,
    name: 'newContact',
    classification: 'READ',
    displayName: 'New Contact',
    description: 'Fires when a new contact is created',
    aiMetadata: {
      description: 'Fires when a new contact is created in the Systeme.io account, delivering the new contact record (email, fields, tags). Use to react to newly captured leads or subscribers.',
    },
    props: {},
    sampleData: contactSample,
    outputSchema: newContactTriggerOutputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await systemeWebhook.enable({
            auth: context.auth,
            webhookUrl: context.webhookUrl,
            store: context.store,
            event: 'CONTACT_CREATED',
            prefix: 'new_contact',
        });
    },
    async onDisable(context) {
        await systemeWebhook.disable({ auth: context.auth, store: context.store, prefix: 'new_contact' });
    },
    async run(context) {
        if (!(await systemeWebhook.accept({ store: context.store, payload: context.payload, prefix: 'new_contact' }))) {
            return [];
        }

        return [systemeWebhook.unwrap({ body: context.payload.body, key: 'contact' })];
    }
});
