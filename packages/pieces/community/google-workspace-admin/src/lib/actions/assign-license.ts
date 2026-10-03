import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient } from '../common/client';
import { LicenseAssignment, licensingHelpers } from '../common/licensing';
import { googleAdminProps } from '../common/props';

export const assignLicense = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'assign_license',
  classification: 'WRITE',
  displayName: 'Assign License',
  description: 'Assigns a product license to a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Assign a Google product license (e.g. Workspace Business Standard) to a user. Use Reassign License to switch a user to a different edition of the same product. A retry fails if the user already holds that license.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    product: googleAdminProps.product({ required: true }),
    sku: googleAdminProps.sku({ required: true }),
  },
  async run({ auth, propsValue }) {
    const assignment = await googleAdminClient.request<LicenseAssignment>({
      auth,
      method: HttpMethod.POST,
      url: licensingHelpers.assignmentUrl({ productId: propsValue.product, skuId: propsValue.sku }),
      body: { userId: propsValue.user },
    });
    return licensingHelpers.flattenAssignment(assignment);
  },
});
