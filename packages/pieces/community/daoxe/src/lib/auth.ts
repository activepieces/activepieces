import { PieceAuth, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { DEFAULT_BASE_URL, unauthorizedMessage } from './common/common';

export const daoxeAuth = PieceAuth.CustomAuth({
  description: `DaoXE is a multi-model API gateway with an OpenAI-compatible Chat Completions API.

1. Create an API key at https://daoxe.com
2. Base URL defaults to https://daoxe.com/v1
3. Model IDs are account-scoped — use exact IDs from your dashboard or GET /v1/models

DaoXE is not available in mainland China.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your DaoXE API key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'OpenAI-compatible base URL. Default: https://daoxe.com/v1',
      required: false,
      defaultValue: DEFAULT_BASE_URL,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseURL = (auth.props.baseUrl || DEFAULT_BASE_URL).replace(
        /\/$/,
        '',
      );
      const openai = new OpenAI({
        baseURL,
        apiKey: auth.props.apiKey,
      });
      const models = await openai.models.list();
      if (models.data.length > 0) {
        return { valid: true };
      }
      return { valid: false, error: unauthorizedMessage };
    } catch (e) {
      return { valid: false, error: unauthorizedMessage };
    }
  },
});
