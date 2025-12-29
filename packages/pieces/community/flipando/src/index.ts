import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { flipandoAuth } from './lib/common/auth';
import { runApp } from './lib/actions/run-app';
import { getTask } from './lib/actions/get-task';
import { runAppGenerator } from './lib/actions/run-app-generator';
import { getAllApps } from './lib/actions/get-all-apps';

export const flipando = createPiece({
  displayName: 'Flipando',
  auth: flipandoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/flipando.png',
  authors: ['sanket-a11y'],
  actions: [getAllApps, runApp, getTask, runAppGenerator],
  triggers: [],
});
