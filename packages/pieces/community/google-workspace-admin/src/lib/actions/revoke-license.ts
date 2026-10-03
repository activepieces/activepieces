import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient } from '../common/client';
import { licensingHelpers } from '../common/licensing';
import { googleAdminProps } from '../common/props';

export const revokeLicense = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'revoke_license',
  classification: 'DESTRUCTIVE',
  displayName: 'Revoke License',
  description: 'Removes a product license from a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove a product license from a user; they lose access to that product. A retry after success fails because the assignment no longer exists.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    product: googleAdminProps.product({ required: true }),
    sku: googleAdminProps.sku({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: licensingHelpers.assignmentUrl({
        productId: propsValue.product,
        skuId: propsValue.sku,
        userId: propsValue.user,
      }),
    });
    return { success: true, user: propsValue.user, product_id: propsValue.product, sku_id: propsValue.sku };
  },
});
