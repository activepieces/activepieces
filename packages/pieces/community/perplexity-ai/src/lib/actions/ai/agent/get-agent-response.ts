import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import type { PerplexityAiAgentResponse } from '../../../common/types';

export const getAgentResponseAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_get_agent_response',
  displayName: 'Get Agent Response',
  description: 'Retrieve an Agent API response by its id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Agent API response once, with its status (queued, in_progress, completed, failed, incomplete or cancelled), output items and usage. Use it to poll a background response from Create Agent Response until the status is terminal; it never waits itself. Responses created with Store "false" are not retrievable.',
    idempotent: true,
  },
  props: {
    responseId: Property.ShortText({
      displayName: 'Response ID',
      description: 'Response id ("resp_..."), from Create Agent Response.',
      required: true,
    }),
  },
  async run(context) {
    return await perplexityAiClient.request<PerplexityAiAgentResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/agent/${encodeURIComponent(context.propsValue.responseId)}`,
    });
  },
});
