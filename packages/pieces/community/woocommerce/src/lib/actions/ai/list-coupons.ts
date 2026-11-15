import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listCouponsOutputSchema } from '../../output-schemas';

export const wooAiListCoupons = createAction({
  name: 'list_coupons',
  classification: 'SEARCH',
  displayName: 'List Coupons',
  description: 'List coupons, or find one by its exact code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists discount coupons with their codes, amounts, limits and usage counts. Pass code to look up one coupon by its exact code (the way to get a coupon id for get_coupon, update_coupon or delete_coupon, and to check that a code is free before create_coupon). Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listCouponsOutputSchema,
  props: {
    code: Property.ShortText({
      displayName: 'Code',
      description: 'Exact coupon code to find.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against coupon codes and descriptions.',
      required: false,
    }),
    after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only return coupons created after this date and time (ISO 8601).',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Only return coupons created before this date and time (ISO 8601).',
      required: false,
    }),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/coupons',
      queryParams: {
        code: wooValues.nonEmpty(props.code),
        search: wooValues.nonEmpty(props.search),
        after: wooValues.nonEmpty(props.after),
        before: wooValues.nonEmpty(props.before),
        ...paging,
      },
    });
  },
});
