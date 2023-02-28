import { createPiece } from '@activepieces/framework';
import { triggers } from './lib/triggers';

export const calcom = createPiece({
  name: 'cal.com',
  displayName: 'Cal.com',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  version: '0.0.0',
  actions: [],
	authors: ['kanarelo'],
  triggers,
});
