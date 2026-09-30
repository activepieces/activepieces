import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient, LICENSING_URL } from '../common/client';
import { LicenseAssignment, licensingHelpers } from '../common/licensing';
import { googleAdminProps } from '../common/props';

export const listLicenses = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_licenses',
  classification: 'SEARCH',
  displayName: 'List License Assignments',
  description: 'Lists the users who hold a product license.',
  audience: 'both',
  aiMetadata: {
    description:
      'List every user holding a license for a product, optionally narrowed to one SKU (edition). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    product: googleAdminProps.product({ required: true }),
    sku: googleAdminProps.sku({ required: false }),
    limit: Property.Number({ displayName: 'Max Results', required: false, defaultValue: 1000 }),
  },
  async run({ auth, propsValue }) {
    const customerId = await googleAdminClient.getCustomerId({ auth });
    const product = encodeURIComponent(propsValue.product);
    const url = propsValue.sku
      ? `${LICENSING_URL}/product/${product}/sku/${encodeURIComponent(propsValue.sku)}/users`
      : `${LICENSING_URL}/product/${product}/users`;
    const assignments = await googleAdminClient.listAll<
      { nextPageToken?: string; items?: LicenseAssignment[] },
      LicenseAssignment
    >({
      auth,
      url,
      getItems: (r) => r.items,
      queryParams: { customerId },
      limit: propsValue.limit ?? 1000,
    });
    return assignments.map(licensingHelpers.flattenAssignment);
  },
});
