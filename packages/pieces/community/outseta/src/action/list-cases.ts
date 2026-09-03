import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaEnums } from '../common/enums';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaCase } from '../common/outseta-types';

export const listCasesAction = createAction({
  name: 'list_cases',
  auth: outsetaAuth,
  displayName: 'List Tickets',
  description: 'List support tickets, optionally filtered and sorted.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta support tickets with optional filters (free-text search, submitter UID or email, source, subject, submitted or created date range) and sorting, returning subject, body, source, submitter and assignment. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'ticket',
      display: 'builder',
      label: 'Ticket',
      icon: 'inbox',
      props: ['search', 'subject', 'source'],
    },
    {
      key: 'submitter',
      display: 'builder',
      label: 'Submitted by',
      icon: 'user',
      props: ['fromPersonUid', 'fromPersonEmail'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['submittedRange', 'createdRange'],
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
      required: false,
      icon: 'text',
      placeholder: 'refund',
    }),
    subject: Property.ShortText({
      displayName: 'Subject contains',
      required: false,
      icon: 'text',
      placeholder: 'invoice',
    }),
    source: Property.StaticDropdown({
      displayName: 'Source is',
      required: false,
      icon: 'filter',
      options: { disabled: false, options: outsetaEnums.supportCaseSource.options },
    }),
    fromPersonUid: Property.ShortText({
      displayName: 'Submitter UID is',
      required: false,
      icon: 'user',
      placeholder: 'dQG7vBzQ',
    }),
    fromPersonEmail: Property.ShortText({
      displayName: 'Submitter email is',
      required: false,
      icon: 'user',
      placeholder: 'jane@example.com',
    }),
    submittedRange: Property.DateRange({
      displayName: 'Submitted',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    createdRange: Property.DateRange({
      displayName: 'Created',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    sortBy: outsetaListProps.sortBy({
      options: [
        { label: 'Created', value: 'Created' },
        { label: 'Updated', value: 'Updated' },
        { label: 'Submitted', value: 'SubmittedDateTime' },
        { label: 'Last activity', value: 'LastActivity' },
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
        { field: 'Subject', operator: 'contains', value: context.propsValue.subject },
        { field: 'Source', value: context.propsValue.source },
        { field: 'FromPerson.Uid', value: context.propsValue.fromPersonUid },
        { field: 'FromPerson.Email', value: context.propsValue.fromPersonEmail },
        ...outsetaQuery.dateRangeFilters({
          field: 'SubmittedDateTime',
          range: context.propsValue.submittedRange,
        }),
        ...outsetaQuery.dateRangeFilters({
          field: 'Created',
          range: context.propsValue.createdRange,
        }),
      ],
      orderBy: context.propsValue.sortBy,
      orderDirection: context.propsValue.direction,
      limit: context.propsValue.limit,
      page: context.propsValue.page,
    });

    const result = await client.getPage<OutsetaCase>(
      `/api/v1/support/cases?${query}&fields=*,FromPerson.Uid,FromPerson.Email,FromPerson.FullName`
    );

    return {
      items: result.items.map(outsetaMappers.supportCase),
      ...outsetaQuery.pageInfo(result),
    };
  },
});
