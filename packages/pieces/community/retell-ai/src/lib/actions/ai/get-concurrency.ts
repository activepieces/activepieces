import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';

export const getConcurrencyAction = createAction({
  auth: retellAiAuth,
  name: 'get_concurrency',
  classification: 'READ',
  displayName: 'Get Concurrency',
  description: 'Returns current and maximum concurrent calls.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns how many calls run right now, the concurrency limit and how many slots are free. Check it before placing many calls, since calls over the limit fail. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: retellSchemas.concurrency,
  async run({ auth }) {
    const response = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.GET, path: '/get-concurrency', retryRateLimit: true });
    return retellMap.concurrency(response);
  },
});
