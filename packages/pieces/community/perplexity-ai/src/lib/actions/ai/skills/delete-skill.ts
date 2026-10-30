import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';

export const deleteSkillAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_delete_skill',
  displayName: 'Delete Skill',
  description: 'Permanently delete a skill.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a skill and all its revisions; it cannot be restored. Expected Revision must be the current revision (from Get Skill), else it fails with 409 so a newer update is never deleted by mistake.',
    idempotent: false,
  },
  props: {
    skillId: Property.ShortText({
      displayName: 'Skill ID',
      description: 'Skill id from List Skills or Create Skill.',
      required: true,
    }),
    expectedRevision: Property.ShortText({
      displayName: 'Expected Revision',
      description: "The skill's current revision, from Get Skill.",
      required: true,
    }),
  },
  async run(context) {
    const { skillId, expectedRevision } = context.propsValue;
    await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/v1/skills/${encodeURIComponent(skillId)}`,
      query: perplexityAiUtils.toQuery({
        params: { expected_revision: expectedRevision },
      }),
    });
    return { deleted: true, skill_id: skillId };
  },
});
