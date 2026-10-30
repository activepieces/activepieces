import { PieceAuth } from '@activepieces/pieces-framework';
import { detectKeyType, vendorDetail, toMindeeError } from './common/client';

export const mindeeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to the Mindee platform at [app.mindee.com](https://app.mindee.com).
2. Open **API Keys** and create a key.
3. Copy the key and paste it here.

Keys from the legacy platform (platform.mindee.com) only work with the **Predict Document (Legacy v1)** action.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const keyType = await detectKeyType(auth);
      if (keyType === 'v2') {
        return { valid: true };
      }
      if (keyType === 'v1') {
        return {
          valid: false,
          error:
            'This is a legacy Mindee v1 API key (platform.mindee.com). The Mindee actions use the v2 API: create an API key at app.mindee.com and paste it here.',
        };
      }
      return { valid: false, error: 'Mindee rejected this API key. Copy it again from app.mindee.com > API Keys.' };
    } catch (error) {
      const mapped = toMindeeError({ error, api: 'v2' });
      const detail = mapped === undefined ? (error instanceof Error ? error.message : String(error)) : vendorDetail(mapped.responseBody) ?? mapped.message;
      return { valid: false, error: `Could not check the API key with Mindee: ${detail}` };
    }
  },
});
