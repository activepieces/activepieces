import { createAction, Property } from '@activepieces/pieces-framework';
import { opportifyAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const analyzeIpAddressAction = createAction({
  displayName: 'Analyze IP Address',
  name: 'analyze-ip-address',
  description: 'Provides comprehensive insights into a specified IP address.',
  auth: opportifyAuth,
  props: {
    ip: Property.ShortText({
      displayName: 'Ip Address',
      required: true,
    }),
    enableAI: Property.Checkbox({
      displayName: 'Enable AI?',
      required: false,
    }),
  },
  async run(context) {
    const { ip, enableAI } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.opportify.ai/insights/v1/ip/analyze',
      headers: {
        'x-opportify-token': context.auth.secret_text,
      },
      body: {
        ip,
        enableAI,
      },
    });

    return response.body;
  },
});
