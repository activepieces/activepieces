import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiGetRemainingQuota = createAction({
  auth: joggAiAuth,
  name: 'ai_get_remaining_quota',
  displayName: 'Get Remaining Quota',
  description: 'Gets the remaining JoggAI API credit quota.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: joggAiOutputSchemas.aiRemainingQuota,
  aiMetadata: {
    description:
      'Returns how much JoggAI API quota (credits) the account has left. Use it before starting a video or photo generation to check there is enough credit, or to report usage. Read-only and free.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/user/remaining_quota',
      op: 'get remaining quota',
    });
    return { remaining_quota: data['remaining_quota'] ?? null };
  },
});
