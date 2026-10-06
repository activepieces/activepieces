import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListBrandsOutputSchema } from '../../../output-schemas';

export const zendeskListBrands = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_brands',
  outputSchema: zendeskListBrandsOutputSchema,
  displayName: 'List Brands',
  description: 'List the brands in the account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists brands with their IDs, names and subdomains, for Brand ID on Create Ticket and Update Ticket.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ brands: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/brands.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      brands: response.brands,
      count: response.brands.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
