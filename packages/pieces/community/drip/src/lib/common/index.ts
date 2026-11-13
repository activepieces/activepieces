import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from './client';

const MAX_DROPDOWN_PAGES = 10;
const DROPDOWN_PAGE_SIZE = 1000;

export const dripCommon = {
  baseUrl: (accountId: string) => {
    return `${dripApi.DRIP_ORIGIN}/v2${dripApi.accountPath(accountId)}`;
  },
  account_id: Property.Dropdown({
    auth: dripAuth,
    displayName: 'Account',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please fill in API key first',
        };
      }
      try {
        const accounts = await dripApi.listAccounts(auth.secret_text);
        if (accounts.length === 0) {
          return { disabled: true, options: [], placeholder: 'This API token has no Drip accounts' };
        }
        return {
          disabled: false,
          options: accounts.map((account) => ({ value: account.id, label: account.name })),
        };
      } catch (error) {
        return dropdownError(error);
      }
    },
  }),
  campaign_id: ({ required, description }: { required: boolean; description?: string }) =>
    Property.Dropdown({
      displayName: 'Email Series Campaign',
      description,
      auth: dripAuth,
      refreshers: ['account_id'],
      required,
      options: async ({ auth, account_id }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please fill in API key first',
          };
        }
        if (!account_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an account first',
          };
        }
        try {
          const { campaigns, truncated } = await listAllCampaigns({ token: auth.secret_text, accountId: String(account_id) });
          if (campaigns.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'Please create an email series campaign',
            };
          }
          return {
            disabled: false,
            ...(truncated ? { placeholder: `Showing the first ${campaigns.length} email series campaigns by name. Drip has more, so some campaigns are not listed here.` } : {}),
            options: campaigns.map((campaign) => ({
              value: String(campaign['id']),
              label: `${String(campaign['name'] ?? campaign['id'])} (${String(campaign['status'] ?? 'unknown')})`,
            })),
          };
        } catch (error) {
          return dropdownError(error);
        }
      },
    }),
  subscriber: Property.ShortText({
    required: true,
    displayName: 'Subscriber Email',
    description: 'Email of the subscriber',
  }),
  tags: Property.Array({
    displayName: 'Tags',
    required: false,
    description: 'Tags to apply to subscriber',
  }),
  custom_fields: Property.Object({
    displayName: 'Custom Fields',
    required: false,
    description: 'Custom field data about the subscriber',
  }),
  authorizationHeader: (apiKey: AppConnectionValueForAuthProperty<typeof dripAuth>) => dripApi.authHeader(apiKey.secret_text),
  dropdownError,
  listAllCampaigns,
};

function dropdownError(error: unknown): { disabled: true; options: []; placeholder: string } {
  const message = error instanceof Error ? error.message : String(error);
  return { disabled: true, options: [], placeholder: message.slice(0, 300) };
}

async function listAllCampaigns({ token, accountId }: { token: string; accountId: string }): Promise<{ campaigns: Record<string, unknown>[]; truncated: boolean }> {
  const pages: Record<string, unknown>[][] = [];
  let truncated = false;
  for (let page = 1; page <= MAX_DROPDOWN_PAGES; page++) {
    const result = await dripApi.listPage({
      token,
      accountId,
      resource: '/campaigns',
      key: 'campaigns',
      operation: 'list email series campaigns',
      page,
      perPage: DROPDOWN_PAGE_SIZE,
      query: { status: 'all', sort: 'name', direction: 'asc' },
    });
    pages.push(result.items);
    if (!result.hasMore) {
      break;
    }
    truncated = page === MAX_DROPDOWN_PAGES;
  }
  return { campaigns: pages.flat(), truncated };
}
