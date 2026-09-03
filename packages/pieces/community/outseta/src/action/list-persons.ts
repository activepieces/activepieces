import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaPerson } from '../common/outseta-types';

export const listPersonsAction = createAction({
  name: 'list_persons',
  auth: outsetaAuth,
  displayName: 'List Persons',
  description:
    'List CRM people, optionally filtered and sorted. Each person comes back in the same shape as Retrieve Person.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta CRM people with optional filters (free-text search, email, first or last name, job title, created or updated date range) and sorting. Items have the same shape as Retrieve Person. Use for browsing or filtering many people; to fetch one known person use Retrieve Person. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'person',
      display: 'builder',
      label: 'Person',
      icon: 'user',
      props: ['search', 'email', 'firstName', 'lastName', 'title'],
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
      description: 'Matches the first name, last name or email address.',
      required: false,
      icon: 'text',
      placeholder: 'jane',
    }),
    email: Property.ShortText({
      displayName: 'Email contains',
      required: false,
      icon: 'user',
      placeholder: '@example.com',
    }),
    firstName: Property.ShortText({
      displayName: 'First name contains',
      required: false,
      icon: 'text',
      placeholder: 'Jane',
    }),
    lastName: Property.ShortText({
      displayName: 'Last name contains',
      required: false,
      icon: 'text',
      placeholder: 'Doe',
    }),
    title: Property.ShortText({
      displayName: 'Job title contains',
      required: false,
      icon: 'tag',
      placeholder: 'Head of',
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
        { label: 'Email', value: 'Email' },
        { label: 'First name', value: 'FirstName' },
        { label: 'Last name', value: 'LastName' },
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
        { field: 'Email', operator: 'contains', value: context.propsValue.email },
        { field: 'FirstName', operator: 'contains', value: context.propsValue.firstName },
        { field: 'LastName', operator: 'contains', value: context.propsValue.lastName },
        { field: 'Title', operator: 'contains', value: context.propsValue.title },
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

    const result = await client.getPage<OutsetaPerson>(
      `/api/v1/crm/people?${query}&${PERSON_FIELDS}`
    );

    return {
      items: result.items.map(outsetaMappers.person),
      ...outsetaQuery.pageInfo(result),
    };
  },
});

const PERSON_FIELDS =
  'fields=*,MailingAddress.*,PersonAccount.IsPrimary,PersonAccount.Role,PersonAccount.Account.Uid,PersonAccount.Account.Name,PersonAccount.Account.AccountStage';
