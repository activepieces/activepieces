import { createPiece } from '@activepieces/framework';
import { triggers } from './triggers';

export const calcom = createPiece({
  name: 'cal.com',
  displayName: 'Cal.com',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  actions: [],
	authors: ['kanarelo'],
  triggers,
});
