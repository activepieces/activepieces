import { createPiece } from '@activepieces/pieces-framework';
import { getVendor } from './lib/actions/get-vendor';
import { getCustomer } from './lib/actions/get-customer';
import { runSuiteQL } from './lib/actions/run-suiteql';
import { executeDataset } from './lib/actions/execute-dataset';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { buildNetSuiteAuthorizationHeader } from './lib/common/client';
import { netsuiteAuth } from './lib/auth';

export { netsuiteAuth };

export const netsuite = createPiece({
  displayName: 'NetSuite',
  logoUrl: 'https://cdn.activepieces.com/pieces/netsuite.png',
  categories: [PieceCategory.ACCOUNTING],
  auth: netsuiteAuth,
  authors: ['geekyme', 'danielpoonwj'],
  actions: [
    getVendor,
    getCustomer,
    runSuiteQL,
    executeDataset,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        return `https://${auth.props.accountId}.suitetalk.api.netsuite.com`;
      },
      auth: netsuiteAuth,
      authMapping: async (auth, propsValue) => {
        const authHeader = buildNetSuiteAuthorizationHeader({
          auth,
          url: propsValue['url']['url'],
          method: propsValue['method'],
          queryParams: propsValue['queryParams'],
        });

        return {
          Authorization: authHeader,
          prefer: 'transient',
          Cookie: 'NS_ROUTING_VERSION=LAGGING',
        };
      },
    }),
  ],
  triggers: [],
});
