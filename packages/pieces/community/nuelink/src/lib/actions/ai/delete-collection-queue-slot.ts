import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';

export const aiDeleteCollectionQueueSlot = createAction({
  name: 'nuelink_delete_collection_queue_slot',
  classification: 'DESTRUCTIVE',
  auth: nuelinkAuths,
  displayName: 'Delete Queue Time Slot',
  description: 'Deletes one weekly time slot from a collection\'s queue.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one weekly queue slot of a collection; queueId comes from nuelink_get_schedule (queueId) or nuelink_list_collections (queues[].id). Queued posts then wait for the remaining slots. Confirm with the user first. A repeat call returns 404.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID the slot belongs to.' }),
    queueId: nuelinkAiProps.idText({ displayName: 'Slot ID', description: 'The numeric queue slot ID from nuelink_get_schedule or nuelink_list_collections.', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.deletedQueueSlot,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.numericId({ value: context.propsValue.collectionId, label: 'Collection ID' });
    const queueId = nuelinkClient.numericId({ value: context.propsValue.queueId, label: 'Slot ID' });
    return nuelinkClient.request({ apiKey, method: HttpMethod.DELETE, path: ['brands', brandId, 'collections', collectionId, 'queues', queueId] });
  },
});
