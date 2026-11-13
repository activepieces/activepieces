import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';
import { perplexityAiGetSkillDownloadUrlOutputSchema } from '../../../output-schemas';

export const getSkillDownloadUrlAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_get_skill_download_url',
  outputSchema: perplexityAiGetSkillDownloadUrlOutputSchema,
  displayName: 'Get Skill Download URL',
  description: 'Get a short-lived URL to download a skill bundle.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns a short-lived URL to download a skill's zip bundle, at the active revision or a given one. It does not fetch the bundle.",
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
      path: `/v1/skills/${encodeURIComponent(skillId)}/download`,
      query: perplexityAiUtils.toQuery({ params: { revision } }),
    });
  },
});
