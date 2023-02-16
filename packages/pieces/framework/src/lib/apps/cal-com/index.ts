import { createPiece } from '../../framework/piece';
import { triggers } from './triggers';

export const calcom = createPiece({
  name: 'cal.com',
  displayName: 'Cal.com',
  logoUrl: 'https://cal.com/logo.svg',
  actions: [],
  triggers,
});
