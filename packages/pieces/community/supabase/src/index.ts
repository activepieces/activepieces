import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { uploadFile } from './lib/actions/upload-file';

export const supabaseAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});
export const supabase = createPiece({
  displayName: 'Supabase',
  auth: supabaseAuth,
  minimumSupportedRelease: '0.6.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/supabase.png',
  authors: ['abuaboud'],
  categories: [PieceCategory.DATABASES],
  actions: [uploadFile],
  triggers: [],
});
