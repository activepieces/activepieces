import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient } from '../common/client';
import { LicenseAssignment, licensingHelpers } from '../common/licensing';
import { googleAdminProps } from '../common/props';

export const reassignLicense = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'reassign_license',
  classification: 'WRITE',
  displayName: 'Reassign License',
  description: 'Moves a user from one edition of a product to another, e.g. Business Starter to Business Plus.',
  audience: 'both',
  aiMetadata: {
    description:
      "Switch a user's license to a different SKU of the same product (upgrade or downgrade) without losing data. The user must currently hold the Current License. Safe to retry once applied.",
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    product: googleAdminProps.product({ required: true }),
    currentSku: googleAdminProps.sku({ displayName: 'Current License (SKU)', required: true }),
    newSku: googleAdminProps.sku({ displayName: 'New License (SKU)', required: true }),
  },
  async run({ auth, propsValue }) {
    const assignment = await googleAdminClient.request<LicenseAssignment>({
      auth,
      method: HttpMethod.PATCH,
      url: licensingHelpers.assignmentUrl({
        productId: propsValue.product,
        skuId: propsValue.currentSku,
        userId: propsValue.user,
      }),
      body: { skuId: propsValue.newSku },
    });
    return licensingHelpers.flattenAssignment(assignment);
  },
});
