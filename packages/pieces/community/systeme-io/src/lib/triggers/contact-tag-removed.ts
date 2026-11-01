import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeWebhook } from '../common/webhook';
import { contactSample } from '../common/samples';
import { tagPicker } from '../common/dropdowns';
import { contactTagRemovedTriggerOutputSchema } from '../output-schemas';

const PREFIX = 'contact_tag_removed';

export const contactTagRemoved = createTrigger({
  auth: systemeIoAuth,
  name: 'contact_tag_removed',
  classification: 'READ',
  displayName: 'Tag Removed from Contact',
  description: 'Fires when a tag is removed from a contact (optionally only a chosen tag)',
  aiMetadata: {
    description:
      'Fires when a tag is removed from a Systeme.io contact, once per removal, delivering the contact (with its remaining tags) and the removed tag. Fires for every tag unless the optional tag filter is set. Use to react to a contact leaving a tag-based segment.',
  },
  props: {
    tag: tagPicker({
      required: false,
      displayName: 'Only for Tag',
      description: 'Optional. Pick a tag to run the flow only when that tag is removed. Leave empty to run for every tag.',
    }),
  },
  sampleData: {
    contact: { ...contactSample, tags: [{ id: 1, name: 'some_tag' }] },
    tag: { id: 2, name: 'another_tag' },
  },
  outputSchema: contactTagRemovedTriggerOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await systemeWebhook.enable({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      store: context.store,
      event: 'CONTACT_TAG_REMOVED',
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
    return systemeWebhook.tagEvent({ body: context.payload.body, tagFilter: context.propsValue.tag });
  },
});
