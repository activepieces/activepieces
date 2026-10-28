import { createAction, Property } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { sendItRequests, validateLimit } from '../common/requests';

export const listFailedPosts = createAction({
  auth: sendItAuth,
  name: 'list_failed_posts',
  classification: 'SEARCH',
  displayName: 'List Failed Posts',
  description: 'List posts that exhausted their retries (dead letter queue)',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists posts SendIt gave up on after retries (the dead letter queue), each with the error and retry count. Use it to find why scheduled posts did not go out. count is the number returned in this response. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    status: Property.ShortText({ displayName: 'Status', description: 'Optional status filter as SendIt reports it (e.g. pending).', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum number of posts (1-100).', required: false }),
  },
  outputSchema: sendItOutputSchemas.deadLetterList,
  async run(context) {
    return sendItRequests.listDeadLetter({ apiKey: apiKeyOf(context.auth), status: context.propsValue.status ?? undefined, limit: validateLimit({ value: context.propsValue.limit, label: 'Limit', max: 100 }) });
  },
});
