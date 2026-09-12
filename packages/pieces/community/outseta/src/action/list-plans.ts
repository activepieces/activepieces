import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaPlan } from '../common/outseta-types';

export const listPlansAction = createAction({
  name: 'list_plans',
  auth: outsetaAuth,
  displayName: 'List Plans',
  description: 'List billing plans, optionally filtered and sorted.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta billing plans with optional filters (name, active or inactive, per-user, created date range) and sorting, returning rates for every billing term, trial length and quantity rules. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'plan',
      display: 'builder',
      label: 'Plan',
      icon: 'tag',
      props: ['name', 'isActive', 'isPerUser'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['createdRange'],
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
    name: Property.ShortText({
      displayName: 'Name contains',
      required: false,
      icon: 'text',
      placeholder: 'Pro',
    }),
    isActive: Property.StaticDropdown({
      displayName: 'Active',
      required: false,
      icon: 'filter',
      options: {
        disabled: false,
        options: [
          { label: 'Active only', value: 'true' },
          { label: 'Inactive only', value: 'false' },
        ],
      },
    }),
    isPerUser: Property.StaticDropdown({
      displayName: 'Per-user pricing',
      required: false,
      icon: 'users',
      options: {
        disabled: false,
        options: [
          { label: 'Per-user only', value: 'true' },
          { label: 'Flat-rate only', value: 'false' },
        ],
      },
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
        { label: 'Name', value: 'Name' },
        { label: 'Monthly rate', value: 'MonthlyRate' },
        { label: 'Annual rate', value: 'AnnualRate' },
      ],
      defaultValue: 'Name',
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
        { field: 'Name', operator: 'contains', value: context.propsValue.name },
        { field: 'IsActive', value: context.propsValue.isActive },
        { field: 'IsPerUser', value: context.propsValue.isPerUser },
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

    const result = await client.getPage<OutsetaPlan>(
      `/api/v1/billing/plans?${query}&fields=*,PlanFamily.Uid,PlanFamily.Name`
    );

    return {
      items: result.items.map(outsetaMappers.plan),
      ...outsetaQuery.pageInfo(result),
    };
  },
});
