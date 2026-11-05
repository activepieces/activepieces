import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTopSpacesOutputSchema } from '../../../output-schemas';

export const getTopSpacesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_top_spaces',
  outputSchema: podioGetTopSpacesOutputSchema,
  displayName: 'Get Top Spaces',
  description: 'Lists the workspaces you use most.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the workspaces the connected user uses most, each with its organization; a quick source of space ids.',
    idempotent: true,
  },
  props: {
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of workspaces to return. Defaults to 6.' }),
  },
  async run({ auth, propsValue }) {
    const query = podioUtils.query({ values: { limit: propsValue.limit } });
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/space/top/', query });
    return { spaces: body, count: body.length };
  },
});
