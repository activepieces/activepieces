import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { baseUrl as defaultBaseUrl } from './common/common';

export const openaiAuth = PieceAuth.CustomAuth({
  description: `Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`,
  props: {
    apiKey: Property.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
      required: false,
    }),
  },
  validate: async (auth) => {
    try {
      const baseUrl = auth.props.baseUrl || defaultBaseUrl;
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.props.apiKey,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key or base URL',
      };
    }
  },
});
