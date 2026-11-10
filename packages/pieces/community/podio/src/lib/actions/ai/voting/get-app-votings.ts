import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAppVotingsOutputSchema } from '../../../output-schemas';

export const getAppVotingsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_votings',
  outputSchema: podioGetAppVotingsOutputSchema,
  displayName: 'Get App Votings',
  description: 'Lists the votings of an app in display order.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the votings of a Podio app in display order, each with its kind, question and answers; this is where voting and answer ids come from. The app id comes from List Apps.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/voting/app/${propsValue.appId}/voting` });
    return { votings: body, count: body.length };
  },
});
