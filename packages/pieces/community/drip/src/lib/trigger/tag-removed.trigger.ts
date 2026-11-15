import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_tag_removed_trigger';
const EVENT = 'subscriber.removed_tag';

export const dripTagRemovedEvent = createTrigger({
  auth: dripAuth,
  name: 'tag_removed',
  classification: 'READ',
  displayName: 'Tag Removed',
  description: 'Triggers when a tag is removed from a subscriber.',
  aiMetadata: {
    description: 'Fires when a tag is removed from a subscriber in the selected Drip account (Drip event subscriber.removed_tag), optionally only for one tag; the payload has the subscriber and the tag in data.properties.tag.',
  },
  props: {
    account_id: dripCommon.account_id,
    tag: Property.ShortText({ displayName: 'Tag', description: 'Only trigger for this tag (not case-sensitive). Leave empty for every tag.', required: false }),
  },
  sampleData: dripSamples.event({ name: EVENT, properties: { tag: 'Customer' } }),
  outputSchema: dripOutputSchemas.tagEvent,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await dripWebhook.enable({
      token: context.auth.secret_text,
      accountId: context.propsValue.account_id,
      webhookUrl: context.webhookUrl,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
    });
  },
  async onDisable(context) {
    await dripWebhook.disable({ token: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return dripWebhook.handle({
      token: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      payload: context.payload,
      matches: (body) => dripWebhook.textMatches({ expected: context.propsValue.tag, actual: dripWebhook.propertiesOf(body)['tag'] }),
    });
  },
});
