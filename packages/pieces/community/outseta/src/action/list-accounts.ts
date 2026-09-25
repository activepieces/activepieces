import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaEnums } from '../common/enums';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaAccount } from '../common/outseta-types';

export const listAccountsAction = createAction({
  name: 'list_accounts',
  auth: outsetaAuth,
  displayName: 'List Accounts',
  description:
    'List CRM accounts, optionally filtered and sorted. Each account comes back in the same shape as Retrieve Account.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta CRM accounts with optional filters (name, stage, client identifier, created or updated date range, free-text search) and sorting. Items have the same shape as Retrieve Account. Use for browsing or filtering many accounts; to fetch one known account use Retrieve Account. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'account',
      display: 'builder',
      label: 'Account',
      icon: 'user',
      props: ['search', 'name', 'accountStage', 'clientIdentifier'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['createdRange', 'updatedRange'],
    },
    {
      key: 'sort',
      display: 'builder',
      label: 'Sort',
      icon: 'sliders',
      props: ['sortBy', 'direction'],
    },
    { key: 'paging', display: 'footer', props: ['limit', 'page'] },
  ],
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Partial match on the account name, or an exact account UID.',
      required: false,
      icon: 'text',
      placeholder: 'Acme',
    }),
    name: Property.ShortText({
      displayName: 'Name contains',
      required: false,
      icon: 'text',
      placeholder: 'Acme',
    }),
    accountStage: Property.StaticDropdown({
      displayName: 'Stage is',
      required: false,
      icon: 'filter',
      options: { disabled: false, options: outsetaEnums.accountStage.options },
    }),
    clientIdentifier: Property.ShortText({
      displayName: 'Client identifier is',
      required: false,
      icon: 'tag',
      placeholder: 'crm-1234',
    }),
    createdRange: Property.DateRange({
      displayName: 'Created',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    updatedRange: Property.DateRange({
      displayName: 'Updated',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    sortBy: outsetaListProps.sortBy({
      options: [
        { label: 'Created', value: 'Created' },
        { label: 'Updated', value: 'Updated' },
        { label: 'Name', value: 'Name' },
        { label: 'Stage', value: 'AccountStage' },
      ],
      defaultValue: 'Created',
    }),
    direction: outsetaListProps.direction(),
    limit: outsetaListProps.limit(),
    page: outsetaListProps.page(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const query = outsetaQuery.build({
      filters: [
        { field: 'q', value: context.propsValue.search },
        { field: 'Name', operator: 'contains', value: context.propsValue.name },
        { field: 'AccountStage', value: context.propsValue.accountStage },
        { field: 'ClientIdentifier', value: context.propsValue.clientIdentifier },
        ...outsetaQuery.dateRangeFilters({
          field: 'Created',
          range: context.propsValue.createdRange,
        }),
        ...outsetaQuery.dateRangeFilters({
          field: 'Updated',
          range: context.propsValue.updatedRange,
        }),
      ],
      orderBy: context.propsValue.sortBy,
      orderDirection: context.propsValue.direction,
      limit: context.propsValue.limit,
      page: context.propsValue.page,
    });

    const result = await client.getPage<OutsetaAccount>(
      `/api/v1/crm/accounts?${query}&${ACCOUNT_FIELDS}`
    );

    return {
      items: result.items.map(outsetaMappers.account),
      ...outsetaQuery.pageInfo(result),
    };
  },
});


const ACCOUNT_FIELDS =
  'fields=*,BillingAddress.*,MailingAddress.*,PrimaryContact.Uid,PrimaryContact.Email,PrimaryContact.FirstName,PrimaryContact.LastName,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,CurrentSubscription.Plan.Name';
