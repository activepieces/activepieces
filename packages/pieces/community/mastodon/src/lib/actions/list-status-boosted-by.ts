import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { accountPageOutputSchema } from '../output-schemas';

export const listStatusBoostedBy = createAction({
  auth: mastodonAuth,
  name: 'list_status_boosted_by',
  classification: 'SEARCH',
  displayName: 'List Accounts That Boosted a Status',
  description: 'List the accounts that boosted (reblogged) a status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of accounts that boosted a given status, with cursors for further pages (pass next_max_id as Max ID, prev_since_id as Since ID). Use List Accounts That Favourited a Status for favourites. Needs the read:accounts scope. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountPageOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'Local ID of the status. Obtain it from a timeline, Get Status or Search.',
      required: true,
    }),
    limit: mastodonProps.limit({ noun: 'accounts', defaultLimit: 40, maxLimit: 80 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
  },
  async run(context) {
    const { status_id, limit, max_id, since_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/statuses/${encodeURIComponent(status_id)}/reblogged_by`,
      operation: 'List Accounts That Boosted a Status',
      scope: 'read:accounts',
      query: { limit, max_id, since_id },
    });
    return { accounts: items, ...cursors };
  },
});
