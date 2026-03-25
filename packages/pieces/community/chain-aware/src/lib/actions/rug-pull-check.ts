import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chainAwareAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const rugPullCheck = createAction({
  auth: chainAwareAuth,
  name: 'rugPullCheck',
  displayName: 'Rug Pull Check',
  description: 'Calculate fraud probability for a contract address',
  props: {
    network: Property.ShortText({
      displayName: 'Network',
      required: true,
    }),
    contractAddress: Property.ShortText({
      displayName: 'Contract Address',
      required: true,
    }),
  },
  async run(context) {
    return makeRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/rug/pull-check',
      body: {
        network: context.propsValue.network,
        contractAddress: context.propsValue.contractAddress,
      },
    });
  },
});
