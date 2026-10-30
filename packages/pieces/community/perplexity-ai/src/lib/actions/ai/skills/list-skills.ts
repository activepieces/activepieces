import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';

export const listSkillsAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_list_skills',
  displayName: 'List Skills',
  description: 'List the skills in your Perplexity project.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists custom skills in the API key's project, newest first, with each skill id, name and revision. Pass next_page_token back as Page Token for the next page. Use a skill name in Create Agent Response Skills.",
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Skills to return, 1-200. Defaults to 20.',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'next_page_token from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, pageToken } = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/skills',
      query: perplexityAiUtils.toQuery({
        params: {
          limit: perplexityAiUtils.clampLimit({ limit, max: 200 }),
          page_token: pageToken,
        },
      }),
    });
  },
});
