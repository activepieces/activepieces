import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';

export const aiGetSchedule = createAction({
  name: 'nuelink_get_schedule',
  classification: 'READ',
  auth: nuelinkAuths,
  displayName: 'Get Weekly Queue Schedule',
  description: 'Returns every weekly queue time slot of a brand, grouped by weekday, in the brand timezone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the brand\'s whole weekly queue (MON..SUN, each slot with time, queueId, collectionId, collectionTitle, collectionStatus) in the brand timezone. Use it to answer when queued posts will go out, or to find a queueId for nuelink_delete_collection_queue_slot. When queueStatus is PAUSED nothing publishes from the queues. Slots of paused collections are not listed, and timezone may be an offset like +03:00. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
  },
  outputSchema: nuelinkOutputSchemas.schedule,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    return nuelinkClient.request({ apiKey, method: HttpMethod.GET, path: ['brands', brandId, 'schedule'] });
  },
});
