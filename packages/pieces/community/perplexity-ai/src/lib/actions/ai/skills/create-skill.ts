import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiCreateSkillOutputSchema } from '../../../output-schemas';

export const createSkillAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_create_skill',
  outputSchema: perplexityAiCreateSkillOutputSchema,
  displayName: 'Create Skill',
  description: 'Create a skill from a zip bundle containing SKILL.md.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Creates a custom skill in the project from a zip bundle; the bundle's SKILL.md supplies the name and description. Returns the skill id and revision, needed by Update Skill and Delete Skill. Not idempotent: each call creates another skill, and a duplicate name fails with 409.",
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Bundle',
      description: 'Zip file containing SKILL.md.',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;
    const form = new FormData();
    form.append('file', file.data, { filename: file.filename });
    return await perplexityAiClient.upload<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/skills',
      form,
    });
  },
});
