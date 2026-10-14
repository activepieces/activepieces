import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listVariants = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_variants',
  displayName: 'List Variants',
  description: 'List product variants, optionally for one product.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy product variants (the purchasable price options), optionally for one product ID and status, with page-based pagination. Use to find a variant ID for checkouts or plan changes. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.variant, itemLabel: 'name' }),
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'Only variants of this product.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: [{ label: 'Published', value: 'published' }, { label: 'Draft', value: 'draft' }, { label: 'Pending', value: 'pending' }] },
    }),
    ...pageProps('variants'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/variants',
      query: {
        'filter[product_id]': optionalId({ value: propsValue.productId, label: 'Product ID' }),
        'filter[status]': propsValue.status ?? undefined,
        ...pageParams(propsValue),
      },
    });
  },
});
