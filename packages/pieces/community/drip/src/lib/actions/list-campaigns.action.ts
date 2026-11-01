import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listCampaignsAction = createAction({
  auth: dripAuth,
  name: 'list_campaigns',
  displayName: 'List Email Series',
  description: 'Lists Email Series Campaigns one page at a time.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Drip Email Series Campaigns (automated email sequences) one page at a time with ID, name, status (draft, active, paused), sender, email count and subscriber counts. Use to find a Campaign ID for Subscribe to Email Series or Remove Subscriber From Email Series; pass the next page while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only campaigns with this status. Defaults to all.',
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Draft', value: 'draft' }, { label: 'Paused', value: 'paused' }],
      },
    }),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.campaignPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: '/campaigns',
      key: 'campaigns',
      operation: 'list email series',
      page,
      perPage,
      query: { status: propsValue.status },
    });
  },
});
