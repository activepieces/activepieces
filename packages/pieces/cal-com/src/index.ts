import { createPiece } from '@activepieces/pieces-framework';
import { triggers } from './lib/triggers';

export const calcom = createPiece({
  displayName: 'Cal.com',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  actions: [],
	authors: ['kanarelo'],
  triggers,
});
