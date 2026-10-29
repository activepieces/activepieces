import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';
import { nuelinkProps } from '../../common/props';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiListBrands = createAction({
  name: 'nuelink_list_brands',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Brands',
  description: 'Lists the Nuelink brands the API key can access, with their IDs and timezones.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Nuelink brands (workspaces) the API key can access, with each brand\'s timezone, which scheduled times are interpreted in. Call this first to get a brandId; on multi-brand accounts, match the brand by title instead of taking the first one. One page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listBrands,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const { page, perPage } = nuelinkInputs.paging({ page: context.propsValue.page, perPage: context.propsValue.perPage });
    return nuelinkClient.getPage({ apiKey, path: ['brands'], page, perPage });
  },
});
