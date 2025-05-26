import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';

export const motionAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use Motion API Key',
});

export const motion = createPiece({
  displayName: 'Motion',
  auth: motionAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/motion.png',
  authors: [],
  actions: [createTask],
  triggers: [],
});
