import { createPiece } from '@activepieces/framework';
import { createImageFromTemplate } from './actions/create-image';

export const bannerbear = createPiece({
  name: 'bannerbear',
  displayName: "Bannerbear",
  logoUrl: 'https://pbs.twimg.com/profile_images/1218008559532724224/AmD0qKnk_400x400.jpg',
  actions: [createImageFromTemplate],
  authors: ["kanarelo"],
  triggers: [],
  version: "0.0.0"
});

