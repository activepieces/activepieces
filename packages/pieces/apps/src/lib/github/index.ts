import { createPiece } from '@activepieces/framework';
import { githubTriggers } from './trigger';

export const github = createPiece({
  name: 'github',
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  actions: [],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
