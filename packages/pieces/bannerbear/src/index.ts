import { createPiece } from '@activepieces/pieces-framework';
import { createImageFromTemplate } from './lib/actions/create-image';

export const bannerbear = createPiece({
  displayName: "Bannerbear",
  logoUrl: 'https://cdn.activepieces.com/pieces/bannerbear.png',
  actions: [createImageFromTemplate],
  authors: ["kanarelo"],
  triggers: [],
});

