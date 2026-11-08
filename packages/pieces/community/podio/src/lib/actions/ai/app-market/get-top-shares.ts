import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetRecommendedSharesOutputSchema } from '../../../output-schemas';

export const getTopSharesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_top_shares',
  outputSchema: podioGetRecommendedSharesOutputSchema,
  displayName: 'Get Top Shares',
  description: 'Lists the top apps or packs in the app market.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the top Podio app market shares in the user\'s language, one page at a time with the total, with the share ids Get Share and Install Share take.',
    idempotent: true,
  },
  props: {
    type: podioAiProps.choice({ required: true, displayName: 'Share Type', description: 'The kind of share: "app" or "pack".', values: ['app', 'pack'] }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of shares to return. Defaults to 6.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/app_store/${propsValue.type}/top/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset } }),
    });
  },
});
