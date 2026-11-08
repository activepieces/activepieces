import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { findAccountOutputSchema } from '../output-schemas';

export const findAccountByName = createAction({
  auth: freshsalesAuth,
  name: 'find_account_by_name',
  displayName: 'Find Account by Name',
  description: 'Look up accounts by exact name',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Looks up Freshsales accounts whose name exactly matches the given text. Returns found and the list of matching accounts (may be empty). Use it to get an account ID before Create Deal or Create Contact.',
    idempotent: true,
  },
  outputSchema: findAccountOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Account Name',
      description: 'Exact account name to look up',
      placeholder: 'Acme Inc',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name.trim();
    if (name.length === 0) {
      throw new Error('Account Name is required.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/lookup',
      query: { q: name, f: 'name', entities: 'sales_account' },
    });
    const group = freshsalesClient.isRecord(response) ? response['sales_accounts'] : undefined;
    const accounts = freshsalesClient
      .readArray({ body: group, key: 'sales_accounts' })
      .filter((item) => freshsalesClient.isRecord(item));
    return { found: accounts.length > 0, accounts };
  },
});
