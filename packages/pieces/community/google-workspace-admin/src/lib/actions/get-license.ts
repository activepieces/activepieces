import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient } from '../common/client';
import { LicenseAssignment, licensingHelpers } from '../common/licensing';
import { googleAdminProps } from '../common/props';

export const getLicense = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_license',
  classification: 'READ',
  displayName: 'Get License Assignment',
  description: 'Checks whether a user holds a specific license.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a user\'s assignment for one product license. Fails with 404 when the user does not hold that license. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    product: googleAdminProps.product({ required: true }),
    sku: googleAdminProps.sku({ required: true }),
  },
  async run({ auth, propsValue }) {
    const assignment = await googleAdminClient.request<LicenseAssignment>({
      auth,
      method: HttpMethod.GET,
      url: licensingHelpers.assignmentUrl({
        productId: propsValue.product,
        skuId: propsValue.sku,
        userId: propsValue.user,
      }),
    });
    return licensingHelpers.flattenAssignment(assignment);
  },
});
