import { createPiece } from '../../framework/piece';
import { githubTriggers } from './trigger';

export const github = createPiece({
  name: 'github',
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  actions: [],
  triggers: githubTriggers,
});
