import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaDiscountCoupon } from '../common/outseta-types';

export const listDiscountsAction = createAction({
  name: 'list_discounts',
  auth: outsetaAuth,
  displayName: 'List Discounts',
  description: 'List discount coupons, optionally filtered and sorted.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta discount coupons with optional filters (search by name or code, still-redeemable only, active or inactive, created date range) and sorting, returning the amount or percentage off, duration and redemption counts. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'discount',
      display: 'builder',
      label: 'Discount',
      icon: 'tag',
      props: ['search', 'canRedeem', 'isActive'],
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
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches the coupon name or code.',
      required: false,
      icon: 'text',
      placeholder: 'WELCOME',
    }),
    canRedeem: Property.StaticDropdown({
      displayName: 'Redeemable',
      required: false,
      icon: 'filter',
      options: {
        disabled: false,
        options: [{ label: 'Still redeemable only', value: 'true' }],
      },
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
        { field: 'canRedeem', value: context.propsValue.canRedeem },
        { field: 'IsActive', value: context.propsValue.isActive },
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

    const result = await client.getPage<OutsetaDiscountCoupon>(
      `/api/v1/billing/discountcoupons?${query}&fields=*`
    );

    return {
      items: result.items.map(outsetaMappers.discount),
      ...outsetaQuery.pageInfo(result),
    };
  },
});
