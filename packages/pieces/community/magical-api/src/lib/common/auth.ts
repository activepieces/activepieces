import { PieceAuth } from '@activepieces/pieces-framework';
import { magicalApiRequest, MagicalApiError } from './client';

export const magicalApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to the [MagicalAPI dashboard](https://panel.magicalapi.com/login).
2. Open **API Info** in the left sidebar.
3. Click **Create API Key**, give it a title and copy the key. It is shown only once.

API keys need a Basic, Pro or Business plan.`,
  required: true,
  validate: async ({ auth }) => validateMagicalApiKey({ apiKey: auth }),
});

export async function validateMagicalApiKey({
  apiKey,
}: {
  apiKey: string;
}): Promise<{ valid: true } | { valid: false; error: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API Key is required.' };
  }
  try {
    await magicalApiRequest({
      apiKey,
      path: VALIDATION_PATH,
      body: { request_id: VALIDATION_REQUEST_ID },
    });
    return { valid: true };
  } catch (error) {
    if (!(error instanceof MagicalApiError)) {
      return { valid: false, error: 'Could not reach MagicalAPI to check the API key. Try again later.' };
    }
    if (error.status === 401) {
      return { valid: false, error: 'Invalid API key.' };
    }
    if (error.status === 404 || error.status === 400) {
      return { valid: true };
    }
    return { valid: false, error: error.message };
  }
}

const VALIDATION_PATH = '/resume-parser';
const VALIDATION_REQUEST_ID = 'activepieces-connection-check';
