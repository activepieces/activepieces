import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const filloutForms = createPiece({
  displayName: 'Fillout-forms',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fillout-forms.png',
  authors: [],
  actions: [],
  triggers: [],
});
