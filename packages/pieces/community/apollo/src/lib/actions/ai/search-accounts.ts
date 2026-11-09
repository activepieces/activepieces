import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchAccountsAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_accounts',
  classification: 'SEARCH',
  displayName: 'Search Accounts',
  description: 'Search accounts (saved companies) in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches accounts (companies saved in your Apollo CRM) by company name, account stage IDs and list IDs, sorted and paged. Run it before Create Account, which never deduplicates. To find net-new companies use Search Organizations. Uses no credits; needs a paid Apollo plan.',
    idempotent: true,
  },
  props: {
    name: aiProps.text({ displayName: 'Company Name', description: 'Account name to match.', required: false }),
    account_stage_ids: aiProps.textList({ displayName: 'Account Stage IDs', description: 'Stage IDs from List Account Stages (field id).', required: false }),
    list_ids: aiProps.textList({ displayName: 'List IDs', description: 'Account list IDs from List Lists (field id).', required: false }),
    sort_by: aiProps.choice({
      displayName: 'Sort By',
      description: 'Sort field (default: last activity).',
      required: false,
      options: [
        { label: 'Last activity', value: 'account_last_activity_date' },
        { label: 'Created at', value: 'account_created_at' },
        { label: 'Updated at', value: 'account_updated_at' },
      ],
    }),
    sort_ascending: aiProps.yesNo({ displayName: 'Oldest First', description: 'yes sorts ascending; default no (newest first).' }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.accountSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const stageIds = apolloInputs.stringList(propsValue.account_stage_ids);
    const listIds = apolloInputs.stringList(propsValue.list_ids);
    const sortBy = apolloInputs.optionalText(propsValue.sort_by);
    const body = await apolloRequests.searchAccounts({
      apiKey: apiKeyOf(auth),
      body: apolloInputs.compact({
        q_organization_name: apolloInputs.optionalText(propsValue.name),
        account_stage_ids: stageIds.length > 0 ? stageIds : undefined,
        account_label_ids: listIds.length > 0 ? listIds : undefined,
        sort_by_field: sortBy,
        sort_ascending: sortBy === undefined ? undefined : apolloInputs.yesNoValue(propsValue.sort_ascending) === true,
        page,
        per_page: perPage,
      }),
    });
    const accounts = recordsOf(body['accounts']).map((account) => apolloMappers.account(account));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: accounts.length }), accounts };
  },
});
