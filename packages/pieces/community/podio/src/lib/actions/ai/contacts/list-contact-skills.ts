import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListContactSkillsOutputSchema } from '../../../output-schemas';

export const listContactSkillsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_contact_skills',
  outputSchema: podioListContactSkillsOutputSchema,
  displayName: 'List Contact Skills',
  description: 'Lists the skills of related contacts, most used first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the skills set on the profiles of the connected user\'s contacts, most frequently used first, optionally matching a search text.',
    idempotent: true,
  },
  props: {
    text: podioAiProps.text({ required: false, displayName: 'Search Text', description: 'Only skills containing this text.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of skills to return. Defaults to 12.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/contact/skill/',
      query: podioUtils.query({ values: { text: propsValue.text, limit: propsValue.limit } }),
    });
    return { skills: body, count: body.length };
  },
});
