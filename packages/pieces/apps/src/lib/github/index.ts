import { createPiece } from '@activepieces/framework';
import { githubTriggers } from './trigger';

export const github = createPiece({
  name: 'github',
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  version: '0.0.0',
  actions: [],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
