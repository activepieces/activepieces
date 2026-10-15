import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listEventActionsAction = createAction({
  auth: dripAuth,
  name: 'list_event_actions',
  displayName: 'List Custom Event Names',
  description: 'Lists the custom event action names recorded in the Drip account.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the custom event action names (e.g. "Logged in") recorded in a Drip account, one page at a time. Use to reuse an existing event name exactly before Record Custom Event; pass the next page while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.stringPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<Record<string, unknown>>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/event_actions`,
      operation: 'list custom event names',
      query: { page, per_page: perPage },
    });
    const items = Array.isArray(body['event_actions']) ? body['event_actions'].map(String) : [];
    return { items, ...dripApi.pageInfo({ meta: body['meta'], page, perPage, count: items.length }) };
  },
});
