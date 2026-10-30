import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

export const cancelAgentResponseAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_cancel_agent_response',
  displayName: 'Cancel Agent Response',
  description: 'Request cancellation of a running Agent API response.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Asks Perplexity to stop a queued or running Agent API response, typically a background one from Create Agent Response. Returns status "cancelling" at once; the run stops shortly after, so poll Get Agent Response for the final status. Work already done is still billed.',
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
    return await perplexityAiClient.request<{
      response_id: string;
      status: string;
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/v1/agent/${encodeURIComponent(
        context.propsValue.responseId
      )}/cancel`,
    });
  },
});
