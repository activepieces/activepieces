import { propsValidation } from '@activepieces/pieces-common';
import { createAction, isNil } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { listAccountsActionOutputSchema } from '../output-schemas';

export const listAccounts = createAction({
  name: 'list-accounts',
  outputSchema: listAccountsActionOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Accounts',
  description: 'Lists the Business Profile accounts the connected user can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Google Business Profile accounts the connected Google user can manage. Each account name has the form accounts/{id}; pass it (or the bare id) as Account ID to List Locations and the review or media actions. Call this first when no account id is known. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    max_results: gmbApi.props.maxResults(),
  },
  async run(ctx) {
    await propsValidation.validateZod(ctx.propsValue, {
      max_results: z.optional(z.number().check(z.gte(1))),
    });
    const { items, nextPageToken } = await gmbApi.paginate({
      accessToken: ctx.auth.access_token,
      url: `${gmbApi.hosts.accountManagement}/accounts`,
      itemsKey: 'accounts',
      pageSize: 20,
      maxResults: ctx.propsValue.max_results ?? 100,
    });
    return {
      accounts: items,
      count: items.length,
      ...(isNil(nextPageToken) ? {} : { next_page_token: nextPageToken }),
    };
  },
});
