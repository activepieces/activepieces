import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';
import { perplexityAiListSkillRevisionsOutputSchema } from '../../../output-schemas';

export const listSkillRevisionsAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_list_skill_revisions',
  outputSchema: perplexityAiListSkillRevisionsOutputSchema,
  displayName: 'List Skill Revisions',
  description: 'List the revisions of a skill.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists a skill's revisions, newest first, with each revision token and creation time. Pass next_page_token back as Page Token for the next page; pass a revision to Get Skill or Get Skill Download URL.",
    idempotent: true,
  },
  props: {
    skillId: Property.ShortText({
      displayName: 'Skill ID',
      description: 'Skill id from List Skills or Create Skill.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Revisions to return, 1-200. Defaults to 20.',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'next_page_token from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const { skillId, limit, pageToken } = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/skills/${encodeURIComponent(skillId)}/revisions`,
      query: perplexityAiUtils.toQuery({
        params: {
          limit: perplexityAiUtils.clampLimit({ limit, max: 200 }),
          page_token: pageToken,
        },
      }),
    });
  },
});
