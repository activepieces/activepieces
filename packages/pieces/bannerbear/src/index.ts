import { createPiece } from '@activepieces/framework';
import { createImageFromTemplate } from './lib/actions/create-image';

export const bannerbear = createPiece({
  name: 'bannerbear',
  displayName: "Bannerbear",
  logoUrl: 'https://cdn.activepieces.com/pieces/bannerbear.png',
  actions: [createImageFromTemplate],
  authors: ["kanarelo"],
  triggers: [],
  version: "0.0.0"
});

