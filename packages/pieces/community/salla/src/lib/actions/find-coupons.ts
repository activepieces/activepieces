import { createAction, dateRangeUtils, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { CouponFilters, sallaMarketing } from '../common/marketing';
import { sallaOutputSchemas } from '../common/output-schemas';

export const findCouponsAction = createAction({
  auth: sallaAuth,
  name: 'find_coupons',
  classification: 'SEARCH',
  displayName: 'Find Coupons',
  description: 'Searches the store coupons by code and dates; with no filters it returns the latest coupons. The Salla app needs the Marketing scope.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Salla coupons by code keyword, creation date and expiry date, and returns the matching coupons with discount, dates and limits. Use it to check a code is free before Create Coupon, or to find a coupon ID for Get Coupon. Read-only and safe to retry; Max Results caps the list (1 to 1000) and it needs the Marketing scope.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.couponList,
  propertyGroups: [
    {
      key: 'search',
      display: 'builder',
      label: 'Code',
      icon: 'tag',
      props: ['keyword'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['created', 'expires'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['max_results'],
    },
  ],
  props: {
    keyword: Property.ShortText({
      displayName: 'Code',
      description: 'All or part of the coupon code, for example SUMMER.',
      placeholder: 'SUMMER',
      icon: 'tag',
      required: false,
    }),
    created: Property.DateRange({
      displayName: 'Created',
      description: 'Only coupons created in this window. Salla filters by whole days in store time (Asia/Riyadh), for example 2026-11-01 to 2026-11-10.',
      display: 'dropdown',
      icon: 'calendar',
      required: false,
    }),
    expires: Property.DateRange({
      displayName: 'Expires',
      description: 'Only coupons that expire in this window. Salla filters by whole days in store time (Asia/Riyadh), for example 2026-12-01 to 2026-12-31.',
      display: 'dropdown',
      icon: 'calendar',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many coupons, from 1 to 1000. Default 50.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const created = dateRangeUtils.resolve(propsValue.created);
    const expires = dateRangeUtils.resolve(propsValue.expires);
    const filters: CouponFilters = {
      maxResults: clampMaxResults(propsValue.max_results),
      keyword: propsValue.keyword ?? undefined,
      createdFrom: created.after,
      createdTo: created.before,
      expiresFrom: expires.after,
      expiresTo: expires.before,
    };
    return sallaMarketing.listCoupons({ auth, filters });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_LIMIT);
}

const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS_LIMIT = 1000;
