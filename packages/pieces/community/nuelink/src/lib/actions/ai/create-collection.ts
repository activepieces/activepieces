import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { NUELINK_LIMITS, nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkInputs } from '../../common/inputs';

export const aiCreateCollection = createAction({
  name: 'nuelink_create_collection',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Create Collection',
  description: 'Creates a collection in a brand, optionally with channels and weekly queue time slots.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new collection (a queue of posts with its own channels and weekly time slots). Collections cannot be deleted through the API, so call nuelink_list_collections first and reuse an existing one when it fits. channels are channel IDs from nuelink_list_channels; queues are brand-local weekday slots like "Tue 09:00" (brand timezone from nuelink_list_brands; at most 10 per day, 5 if the account is unverified). maxRepublish is the evergreen republish interval in weeks (0 = off). Each call creates a new collection: after a timeout check nuelink_list_collections before retrying.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    title: Property.ShortText({ displayName: 'Title', description: 'Collection name, 1 to 255 characters.', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Up to 1,000 characters.', required: false }),
    maxRepublish: Property.Number({ displayName: 'Evergreen Republish Interval (weeks)', description: 'Republish posts every N weeks; 0 or empty turns it off.', required: false }),
    channels: Property.Array({ displayName: 'Channel IDs', description: 'Numeric channel IDs from nuelink_list_channels. Posts in the collection publish to these.', required: false }),
    queues: Property.Array({ displayName: 'Queue Slots', description: 'Weekly brand-local slots like "Mon 09:30". Duplicates are removed.', required: false }),
  },
  outputSchema: nuelinkOutputSchemas.collection,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const props = context.propsValue;
    const brandId = nuelinkClient.numericId({ value: props.brandId, label: 'Brand ID' });
    const title = nuelinkInputs.requiredText({ value: props.title, label: 'Title', max: 255 }).trim();
    const description = nuelinkInputs.optionalText({ value: props.description, label: 'Description', max: 1000 });
    const maxRepublish = nuelinkInputs.optionalInteger({ value: props.maxRepublish, label: 'Evergreen Republish Interval (weeks)', min: 0, max: 10000 });
    const channels = nuelinkInputs.bodyIds({ value: props.channels, label: 'Channel IDs', maxItems: 500 });
    const queues = nuelinkInputs.queueSlots({ value: props.queues, label: 'Queue Slots' });
    return nuelinkClient.request({
      apiKey,
      method: HttpMethod.POST,
      path: ['brands', brandId, 'collections'],
      body: {
        title,
        ...(description === undefined ? {} : { description }),
        ...(maxRepublish === undefined ? {} : { maxRepublish }),
        ...(channels.length === 0 ? {} : { channels }),
        ...(queues.length === 0 ? {} : { queues }),
      },
      timeoutMs: NUELINK_LIMITS.createTimeoutMs,
      timeoutHint: 'The collection may still have been created. Check nuelink_list_collections before trying again.',
    });
  },
});
