import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './common';

export const pdfmonkeyAuth = PieceAuth.CustomAuth({
  description: `Enter your PDFMonkey API Secret Key. You can get this from PDFMonkey dashboard "My Account -> API Authentication"`,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Secret Key',
      description: 'Your PDFMonkey API Secret Key',
      required: true,
    }),
  },
  required: true,
  async validate({ auth }) {
    try {
      const response = await makeRequest({ auth, path: '/document_template_cards' });
      if(response.body?.meta?.current_page != null){
        return { valid: true };
      }

      return {
        valid: false,
        error: response.body,
      };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.message || 'Invalid PDFMonkey credentials',
      };
    }
  },
});