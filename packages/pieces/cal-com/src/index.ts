import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { triggers } from './lib/triggers';

export const calcom = createPiece({
  name: 'cal-com',
  displayName: 'Cal.com',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  actions: [],
	authors: ['kanarelo'],
  triggers,
});
