import { createPiece } from '@activepieces/pieces-framework';
import { addGreetAction } from './lib/actions/add-greet';
import { bonjoroAuth } from './lib/auth';

export const bonjoro = createPiece({
  displayName: 'Bonjoro',
  auth: bonjoroAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bonjoro.png',
  authors: ['joeworkman'],
  actions: [addGreetAction],
  triggers: [],
});

// https://vimily.github.io/bonjoro-api-docs/
// https://www.bonjoro.com/settings/api#/
