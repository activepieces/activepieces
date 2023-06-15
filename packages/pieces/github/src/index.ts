import { createPiece } from '@activepieces/pieces-framework';
import { githubTriggers } from './lib/trigger';

export const github = createPiece({
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  actions: [],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
