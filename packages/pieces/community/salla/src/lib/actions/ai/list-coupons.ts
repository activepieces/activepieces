import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaMarketing } from '../../common/marketing';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListCouponsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_coupons',
  classification: 'SEARCH',
  displayName: 'List Coupons',
  description: 'Lists store coupons that match the given filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Salla discount coupons matching an optional keyword and creation or expiry date ranges, returning each coupon with its id, code, status, type, amount and dates. Use it to find the coupon id for Get Coupon, which adds usage statistics, or to check a code is free before Create Coupon. Returns at most max_results coupons (cap 200) and truncated=true when more exist; needs the Marketing scope.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.couponList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Text to match in the coupon code, for example SUMMER10. Leave empty for all coupons.',
      required: false,
    }),
    created_from: Property.ShortText({
      displayName: 'Created From',
      description: 'Only coupons created on or after this day, store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-11-01.',
      required: false,
    }),
    created_to: Property.ShortText({
      displayName: 'Created To',
      description: 'Only coupons created on or before this day, store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-11-30.',
      required: false,
    }),
    expires_from: Property.ShortText({
      displayName: 'Expires From',
      description: 'Only coupons expiring on or after this day, store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-12-01.',
      required: false,
    }),
    expires_to: Property.ShortText({
      displayName: 'Expires To',
      description: 'Only coupons expiring on or before this day, store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-12-31.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of coupons to return, from 1 to 200, for example 20. Default 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaMarketing.listCoupons({
      auth,
      filters: {
        maxResults: clampMaxResults(propsValue.max_results),
        keyword: propsValue.keyword,
        createdFrom: propsValue.created_from,
        createdTo: propsValue.created_to,
        expiresFrom: propsValue.expires_from,
        expiresTo: propsValue.expires_to,
      },
    });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_CAP);
}

const DEFAULT_MAX_RESULTS = 20;
const MAX_RESULTS_CAP = 200;
