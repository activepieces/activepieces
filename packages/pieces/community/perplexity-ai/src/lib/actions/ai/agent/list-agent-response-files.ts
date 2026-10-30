import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import type { PerplexityAiList } from '../../../common/types';

export const listAgentResponseFilesAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_list_agent_response_files',
  displayName: 'List Agent Response Files',
  description: 'List the files an Agent API response produced.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the files an Agent API response delivered from its sandbox with the share_file tool, with each file id, name and size. Use the file id with Download Agent Response File. Responses that used no sandbox have none.',
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
    return await perplexityAiClient.request<PerplexityAiList<unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/agent/${encodeURIComponent(
        context.propsValue.responseId
      )}/files`,
    });
  },
});
