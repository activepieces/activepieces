import { createPiece } from '@activepieces/pieces-framework';
import { createPasteAction } from './lib/actions/create-paste';
import { getPasteContentAction } from './lib/actions/get-paste-content';
import { pastebinAuth } from './lib/auth';

export const pastebin = createPiece({
  displayName: 'Pastebin',
  description: 'Simple and secure text sharing',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pastebin.png',
  authors: ["JanHolger","kishanprmr","khaledmashaly","abuaboud"],
  categories: [],
  auth: pastebinAuth,
  actions: [createPasteAction, getPasteContentAction],
  triggers: [],
});
