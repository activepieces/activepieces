import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listConversionsAction = createAction({
  auth: dripAuth,
  name: 'list_conversions',
  displayName: 'List Conversions',
  description: 'Lists conversion goals one page at a time.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Drip conversions (goals) one page at a time with ID, name, status, URL, default value in cents and counting method. Use to find a conversion before recording a conversion event. Pass the next page while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only conversions with this status.',
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Disabled', value: 'disabled' }],
      },
    }),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.conversionPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: '/goals',
      key: 'goals',
      operation: 'list conversions',
      page,
      perPage,
      query: { status: propsValue.status },
    });
  },
});
