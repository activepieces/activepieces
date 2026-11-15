import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeWebhook } from '../common/webhook';
import { contactSample } from '../common/samples';
import { newOptInTriggerOutputSchema } from '../output-schemas';

const PREFIX = 'new_opt_in';

export const newOptIn = createTrigger({
  auth: systemeIoAuth,
  name: 'new_opt_in',
  classification: 'READ',
  displayName: 'New Opt-in',
  description: 'Fires when a contact submits an opt-in form, including contacts that already exist',
  aiMetadata: {
    description:
      'Fires each time a contact opts in through a Systeme.io form, delivering the contact with its fields, tags and the source URL of the form. Unlike New Contact it can also fire for contacts that already existed, so use it to react to every form submission.',
  },
  props: {},
  sampleData: { ...contactSample, sourceURL: 'https://webhook-optin.systeme.io/123456aa?utm_source=123' },
  outputSchema: newOptInTriggerOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await systemeWebhook.enable({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      store: context.store,
      event: 'CONTACT_OPT_IN',
      prefix: PREFIX,
    });
  },
  async onDisable(context) {
    await systemeWebhook.disable({ auth: context.auth, store: context.store, prefix: PREFIX });
  },
  async run(context) {
    if (!(await systemeWebhook.accept({ store: context.store, payload: context.payload, prefix: PREFIX }))) {
      return [];
    }
    return [systemeWebhook.unwrap({ body: context.payload.body, key: 'contact' })];
  },
});
