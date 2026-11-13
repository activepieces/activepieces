import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listBroadcastsAction = createAction({
  auth: dripAuth,
  name: 'list_broadcasts',
  displayName: 'List Broadcasts',
  description: 'Lists Single-Email Campaigns (broadcasts) one page at a time.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Drip Single-Email Campaigns (broadcasts) one page at a time with ID, name, status (draft, scheduled, sending, sent, canceled), subject and send time. Use to report on or look up a broadcast; this cannot create or send one. Pass the next page while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only broadcasts with this status. Defaults to all except deleted.',
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'All except deleted', value: 'all' }, { label: 'Draft', value: 'draft' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'Sending', value: 'sending' }, { label: 'Sent', value: 'sent' }, { label: 'Canceled', value: 'canceled' }],
      },
    }),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 100 }),
  },
  outputSchema: dripOutputSchemas.broadcastPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 100 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: '/broadcasts',
      key: 'broadcasts',
      operation: 'list broadcasts',
      page,
      perPage,
      query: { status: propsValue.status },
    });
  },
});
