import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { listAllItemsInModule } from './lib/actions/list-all-items-in-module';
import { listAllModules } from './lib/actions/list-all-modules';

// Usually "https://api.plane.so";
const baseUrl = 'https://projects.oneweb.tech';
export { baseUrl };

export const planeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use API Key from your Plane account settings.',
});

export const plane = createPiece({
  displayName: 'Plane',
  description: 'Interact with Plane project management tool',
  auth: planeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://plane.so/brand-logos/logo-dark.svg',
  authors: ['tumrabert'],
  actions: [listAllModules, listAllItemsInModule],
  triggers: [],
});
