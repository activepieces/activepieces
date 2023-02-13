import { createPiece } from '../../framework/piece';
import { createImageFromTemplate } from './actions/create-image';

export const bannerbear = createPiece({
  name: 'bannerbear',
  displayName: "Bannerbear",
  logoUrl: 'https://pbs.twimg.com/profile_images/1218008559532724224/AmD0qKnk_400x400.jpg',
  actions: [createImageFromTemplate],
  triggers: [],
});

