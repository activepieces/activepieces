import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaEnums } from '../common/enums';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaAddOn } from '../common/outseta-types';

export const listAddOnsAction = createAction({
  name: 'list_addons',
  auth: outsetaAuth,
  displayName: 'List Add-ons',
  description: 'List billing add-ons from the catalogue, optionally filtered and sorted.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta billing add-ons from the catalogue with optional filters (name, billing type, created date range) and sorting, returning rates for every billing term and quantity rules. These are catalogue add-ons, not the add-ons attached to a subscription — for those use Retrieve Subscription. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'addon',
      display: 'builder',
      label: 'Add-on',
      icon: 'tag',
      props: ['name', 'billingAddOnType'],
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
      placeholder: 'Extra seat',
    }),
    billingAddOnType: Property.StaticDropdown({
      displayName: 'Billing type is',
      required: false,
      icon: 'filter',
      options: { disabled: false, options: outsetaEnums.billingAddOnType.options },
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
        { field: 'BillingAddOnType', value: context.propsValue.billingAddOnType },
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

    const result = await client.getPage<OutsetaAddOn>(
      `/api/v1/billing/addons?${query}&fields=*`
    );

    return {
      items: result.items.map(outsetaMappers.addOn),
      ...outsetaQuery.pageInfo(result),
    };
  },
});
