import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetSharesByCategoryOutputSchema } from '../../../output-schemas';

export const getSharesByCategoryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_shares_by_category',
  outputSchema: podioGetSharesByCategoryOutputSchema,
  displayName: 'Get Shares By Category',
  description: 'Lists the app market shares in a category.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio app market shares in one category, one page at a time with the total. The category id comes from List App Market Categories.',
    idempotent: true,
  },
  props: {
    type: podioAiProps.choice({ required: true, displayName: 'Share Type', description: 'The kind of share: "app" or "pack".', values: ['app', 'pack'] }),
    categoryId: podioAiProps.id({ required: true, displayName: 'Category ID', description: 'The id of the category, from List App Market Categories.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of shares to return. Defaults to 6.' }),
    offset: podioAiProps.offset({ required: false }),
    sort: podioAiProps.choice({
      required: false,
      displayName: 'Sort',
      description: 'How to sort the shares. Defaults to "install".',
      values: ['install', 'rating', 'popularity', 'recommended', 'shared_on', 'name'],
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/app_store/${propsValue.type}/category/${propsValue.categoryId}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset, sort: propsValue.sort } }),
    });
  },
});
