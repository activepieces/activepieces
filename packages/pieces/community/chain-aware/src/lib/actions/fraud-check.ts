import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chainAwareAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const fraudCheck = createAction({
  auth: chainAwareAuth,
  name: 'fraudCheck',
  displayName: 'Fraud Check',
  description: 'Calculate fraud probability for a wallet address',
  props: {
    network: Property.ShortText({
      displayName: 'Network',
      required: true,
    }),
    walletAddress: Property.ShortText({
      displayName: 'Wallet Address',
      required: true,
    }),
    onlyFraud: Property.Checkbox({
      displayName: 'Only Fraud',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return makeRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/fraud/check',
      body: {
        network: context.propsValue.network,
        walletAddress: context.propsValue.walletAddress,
        onlyFraud: context.propsValue.onlyFraud ?? false,
      },
    });
  },
});
