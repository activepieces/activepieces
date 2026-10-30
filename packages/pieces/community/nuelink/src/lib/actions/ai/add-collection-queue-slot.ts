import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { NUELINK_LIMITS, nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkInputs } from '../../common/inputs';

export const aiAddCollectionQueueSlot = createAction({
  name: 'nuelink_add_collection_queue_slot',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Add Queue Time Slot',
  description: 'Adds a weekly time slot (weekday and time, brand timezone) to a collection\'s queue.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one weekly queue slot to a collection, given as weekday plus 24-hour time in the BRAND timezone (from nuelink_list_brands), e.g. "Tue 09:00"; do not convert time zones. Queued posts publish at these slots. Nuelink does not reject duplicates, so check nuelink_get_schedule or nuelink_list_collections first, and after a timeout check again before retrying.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID from nuelink_list_collections.' }),
    slot: Property.ShortText({ displayName: 'Slot', description: 'Weekday and brand-local 24-hour time, e.g. "Tue 09:00".', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.queueSlot,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.numericId({ value: context.propsValue.collectionId, label: 'Collection ID' });
    const date = nuelinkInputs.queueSlot({ value: context.propsValue.slot, label: 'Slot' });
    return nuelinkClient.request({
      apiKey,
      method: HttpMethod.POST,
      path: ['brands', brandId, 'collections', collectionId, 'queues'],
      body: { date },
      timeoutMs: NUELINK_LIMITS.createTimeoutMs,
      timeoutHint: 'The slot may still have been added. Check nuelink_get_schedule before trying again.',
    });
  },
});
