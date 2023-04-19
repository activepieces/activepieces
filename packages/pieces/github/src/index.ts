import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { githubTriggers } from './lib/trigger';

export const github = createPiece({
  name: 'github',
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  version: packageJson.version,
  actions: [],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
