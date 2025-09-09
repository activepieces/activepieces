import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { runwayAuth } from './lib/common/auth';
import { runwayCreateTask } from './lib/actions/create-task';
import { runwayGetTask } from './lib/actions/get-task';
import { runwayDeleteTask } from './lib/actions/delete-task';

export const runway = createPiece({
  displayName: 'Runway',
  description: 'Runway task management: create, fetch and delete tasks.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/runway.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['Ripasco'],
  auth: runwayAuth,
  actions: [runwayCreateTask, runwayGetTask, runwayDeleteTask],
  triggers: [],
});

