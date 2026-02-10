import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chainAwareAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const auditWalletAddress = createAction({
  auth: chainAwareAuth,
  name: 'auditWalletAddress',
  displayName: 'Audit Wallet Address',
  description: 'Audit a wallet address for fraud risk',
  props: {
    network: Property.ShortText({
      displayName: 'Network',
      required: true,
    }),
    walletAddress: Property.ShortText({
      displayName: 'Wallet Address',
      required: true,
    }),
  },
  async run(context) {
    return makeRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/fraud/audit',
      body: {
        network: context.propsValue.network,
        walletAddress: context.propsValue.walletAddress,
      },
    });
  },
});
