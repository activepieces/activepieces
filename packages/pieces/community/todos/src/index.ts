import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTodo } from './lib/actions/create-todo';
import { PieceCategory } from '@activepieces/shared';

export const todos = createPiece({
  displayName: 'Todos',
  description:
    'Create tasks for project members to take actions, useful for approvals, reviews, and manual actions performed by humans',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.48.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/manual-tasks.svg',
  authors: ['hazemadelkhalel'],
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  actions: [createTodo],
  triggers: [],
});
