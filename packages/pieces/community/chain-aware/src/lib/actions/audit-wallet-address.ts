import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chainAwareAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const auditWalletAddress = createAction({
  auth: chainAwareAuth,
  name: 'auditWalletAddress',
  displayName: 'Audit Wallet Address',
  description: 'Audit a wallet address for fraud risk',
  audience: 'both',
  aiMetadata: {
    description: 'Run a ChainAware fraud-risk audit on a single on-chain wallet address for a given network (e.g. ethereum, bsc). Choose this for a broad risk overview of a wallet; use Fraud Check when you specifically need a fraud-probability score. Requires the network name and wallet address. Read-only analysis — idempotent.',
    idempotent: true,
  },
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
