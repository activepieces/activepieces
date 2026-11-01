import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pdfmonkeyClient, PdfmonkeyApiError } from './client';

export const pdfmonkeyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your PDFMonkey secret API key. In PDFMonkey, open [My Account](https://dashboard.pdfmonkey.io/account) and copy the API Secret Key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await pdfmonkeyClient.request({ auth, method: HttpMethod.GET, path: '/current_user' });
      return { valid: true };
    } catch (error) {
      if (error instanceof PdfmonkeyApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return { valid: false, error: `Could not verify the API key: ${error instanceof Error ? error.message : 'unknown error'}` };
    }
  },
});
