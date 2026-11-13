import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetRecommendedSharesOutputSchema } from '../../../output-schemas';

export const getRecommendedSharesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_recommended_shares',
  outputSchema: podioGetRecommendedSharesOutputSchema,
  displayName: 'Get Recommended Shares',
  description: 'Lists the recommended apps or packs in the app market for web or mobile.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the shares the Podio app market recommends for the "web" or "mobile" area, with the share ids Get Share and Install Share take.',
    idempotent: true,
  },
  props: {
    type: podioAiProps.choice({ required: true, displayName: 'Share Type', description: 'The kind of share: "app" or "pack".', values: ['app', 'pack'] }),
    area: podioAiProps.choice({ required: true, displayName: 'Area', description: 'Where the recommendations show: "web" or "mobile".', values: ['web', 'mobile'] }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/app_store/${propsValue.type}/recommended/${propsValue.area}/` });
  },
});
