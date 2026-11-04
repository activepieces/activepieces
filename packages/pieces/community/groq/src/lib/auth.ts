import {
  AppConnectionType,
  PieceAuth,
  tryCatch,
} from '@activepieces/pieces-framework';
import { groqApi } from './common/api';

export const groqAuth = PieceAuth.SecretText({
  description:
    'To get your API key:\n1. Open [console.groq.com/keys](https://console.groq.com/keys).\n2. Click **Create API Key**, name it, and copy it.',
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      groqApi.listModels({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
      })
    );
    if (error) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
    return {
      valid: true,
    };
  },
});
