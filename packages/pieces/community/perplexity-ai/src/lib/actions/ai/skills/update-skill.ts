import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUpdateSkillOutputSchema } from '../../../output-schemas';

export const updateSkillAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_update_skill',
  outputSchema: perplexityAiUpdateSkillOutputSchema,
  displayName: 'Update Skill',
  description: 'Upload a new zip bundle as a revision of a skill.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Uploads a new zip bundle as the next revision of an existing skill; name and description are re-read from its SKILL.md. Expected Revision must be the skill's current revision (from Get Skill), else it fails with 409 instead of overwriting a newer change. Not idempotent: each call adds a revision.",
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
    file: Property.File({
      displayName: 'Bundle',
      description: 'Zip file containing SKILL.md.',
      required: true,
    }),
  },
  async run(context) {
    const { skillId, expectedRevision, file } = context.propsValue;
    const form = new FormData();
    form.append('file', file.data, { filename: file.filename });
    return await perplexityAiClient.upload<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/v1/skills/${encodeURIComponent(skillId)}`,
      query: { expected_revision: expectedRevision },
      form,
    });
  },
});
