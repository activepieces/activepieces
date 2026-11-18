import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListAppMarketCategoriesOutputSchema } from '../../../output-schemas';

export const listAppMarketCategoriesAction = createAction({
  auth: podioAuth,
  name: 'podio_list_app_market_categories',
  outputSchema: podioListAppMarketCategoriesOutputSchema,
  displayName: 'List App Market Categories',
  description: 'Lists the app market categories, grouped by type.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio app market categories grouped by type ("vertical" and "functional"), with the category ids that Get Shares By Category, Share App and Update Share take.',
    idempotent: true,
  },
  props: {
    onlyUsed: podioAiProps.bool({
      required: false,
      displayName: 'Only Used',
      description: '"true" returns only categories used by shares in the user\'s language, "false" returns all. Defaults to "true".',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/app_store/category/',
      query: podioUtils.query({ values: { only_used: podioUtils.toBool({ value: propsValue.onlyUsed }) } }),
    });
  },
});
