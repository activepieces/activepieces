import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { githubTriggers } from './lib/trigger';

export const github = createPiece({
  name: 'github',
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  actions: [],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
