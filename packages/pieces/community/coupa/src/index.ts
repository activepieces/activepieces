import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addFileAttachment } from './lib/actions/add-file-attachment';
import { cancelPurchaseOrder } from './lib/actions/cancel-purchase-order';
import { closePurchaseOrder } from './lib/actions/close-purchase-order';
import { createObject } from './lib/actions/create-object';
import { getObjectById } from './lib/actions/get-object-by-id';
import { getRemitToAddresses } from './lib/actions/get-remit-to-addresses';
import { getSupplierSites } from './lib/actions/get-supplier-sites';
import { grantApproval } from './lib/actions/grant-approval';
import { rejectApproval } from './lib/actions/reject-approval';
import { searchObjects } from './lib/actions/search-objects';
import { setIntegrationRunStatus } from './lib/actions/set-integration-run-status';
import { updateObject } from './lib/actions/update-object';
import { coupaAuth } from './lib/auth';
import { CoupaClient } from './lib/common/client';
import { normalizeInstanceUrl } from './lib/common/utils';
import { newOrUpdatedObject } from './lib/triggers/new-or-updated-object';

export { coupaAuth };

export const coupa = createPiece({
  displayName: 'Coupa',
  description:
    'Business spend management — automate procurement, approvals, purchase orders, and ERP integrations with the Coupa Core API.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/coupa.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['maurivan'],
  auth: coupaAuth,
  actions: [
    createObject,
    updateObject,
    getObjectById,
    searchObjects,
    cancelPurchaseOrder,
    closePurchaseOrder,
    addFileAttachment,
    getRemitToAddresses,
    getSupplierSites,
    grantApproval,
    rejectApproval,
    setIntegrationRunStatus,
    createCustomApiCallAction({
      auth: coupaAuth,
      name: 'custom_action',
      displayName: 'Custom Action',
      description:
        'Make a custom API call to any Coupa endpoint (Purchase Orders, Suppliers, Contracts, or other resources).',
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        const host = normalizeInstanceUrl(auth.props.instanceUrl);
        return `https://${host}/api`;
      },
      authMapping: async (auth) => {
        const client = new CoupaClient({
          instanceUrl: auth.props.instanceUrl,
          clientId: auth.props.clientId,
          clientSecret: auth.props.clientSecret,
          scope: auth.props.scope,
        });
        const token = await client.getAccessToken();
        return {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        };
      },
    }),
  ],
  triggers: [newOrUpdatedObject],
});
