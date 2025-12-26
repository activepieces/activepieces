import { createPiece } from '@activepieces/pieces-framework';
import { moonclerkAuth } from './lib/common/auth';
import { retrivePlan } from './lib/actions/retrive-plan';

export const moonclerk = createPiece({
  displayName: 'Moonclerk',
  auth: moonclerkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/moonclerk.png',
  authors: ['sanket-a11y'],
  actions: [retrivePlan],
  triggers: [],
});
