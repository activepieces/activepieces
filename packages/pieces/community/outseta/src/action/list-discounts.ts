import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const listDiscountsAction = createAction({
  name: 'list_discounts',
  auth: outsetaAuth,
  displayName: 'List Discounts',
  description:
    'Retrieve a paginated list of discount coupons from your Outseta billing catalog.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns a paginated list of discount coupons from the billing catalog. Use to discover existing coupon UIDs, e.g. before Apply Discount to Account. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
      description: 'Maximum number of discounts to return (default 100).',
    }),
    offset: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 0,
      description:
        'Page number to fetch (0 = first page, 1 = second page, ...). Outseta uses page-based pagination, not record-based.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const limit = context.propsValue.limit ?? 100;
    const offset = context.propsValue.offset ?? 0;

    return client.get<unknown>(
      `/api/v1/billing/discountcoupons?limit=${limit}&offset=${offset}`
    );
  },
});
