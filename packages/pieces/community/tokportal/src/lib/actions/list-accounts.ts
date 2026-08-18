import { createAction, Property } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { tokportalPaginatedApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const listAccounts = createAction({
  auth: tokportalAuth,
  name: 'list_accounts',
  displayName: 'List Accounts',
  description: 'Lists the delivered (saved) accounts of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'List delivered TokPortal accounts, optionally filtered by platform, country or ban state. Returns a flat array of account objects. Safe to retry.',
    idempotent: true,
  },
  props: {
    platform: tokportalProps.platform(false),
    country: tokportalProps.country(false),
    banned: Property.StaticDropdown({
      displayName: 'Banned',
      description: 'Filter by ban state. Leave empty for all accounts.',
      required: false,
      options: {
        options: [
          { label: 'Only banned accounts', value: 'true' },
          { label: 'Only non-banned accounts', value: 'false' },
        ],
      },
    }),
    maxResults: tokportalProps.maxResults(),
  },
  async run(context) {
    const { platform, country, banned, maxResults } = context.propsValue;
    return await tokportalPaginatedApiCall({
      apiKey: context.auth.secret_text,
      resourceUri: '/accounts',
      query: { platform, country, banned },
      maxResults: maxResults ?? undefined,
    });
  },
});
