import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';

export const getSkillAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_get_skill',
  displayName: 'Get Skill',
  description: "Get a skill's metadata.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Reads one skill's metadata, at the active revision or at a given one; latest_revision always names the newest. Use its revision as Expected Revision in Update Skill or Delete Skill.",
    idempotent: true,
  },
  props: {
    skillId: Property.ShortText({
      displayName: 'Skill ID',
      description: 'Skill id from List Skills or Create Skill.',
      required: true,
    }),
    revision: Property.ShortText({
      displayName: 'Revision',
      description:
        'Revision token from List Skill Revisions. Defaults to the active revision.',
      required: false,
    }),
  },
  async run(context) {
    const { skillId, revision } = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/skills/${encodeURIComponent(skillId)}`,
      query: perplexityAiUtils.toQuery({ params: { revision } }),
    });
  },
});
