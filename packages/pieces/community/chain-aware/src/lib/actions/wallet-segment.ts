import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chainAwareAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const walletSegment = createAction({
  auth: chainAwareAuth,
  name: 'walletSegment',
  displayName: 'Wallet Segment',
  description: 'Get wallet behaviour information',
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
      path: '/segmentation/wallet-segment',
      body: {
        walletAddress: context.propsValue.walletAddress,
        network: context.propsValue.network,
      },
    });
  },
});
