import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTodo } from './lib/actions/create-todo';
import { PieceCategory } from '@activepieces/shared';
import { waitForApproval } from './lib/actions/wait-for-approval';
import { createTodoAndWait } from './lib/actions/create-todo-and-wait';

export const todos = createPiece({
  displayName: 'Todos',
  description:
    'Create tasks for project members to take actions, useful for approvals, reviews, and manual actions performed by humans',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.49.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/manual-tasks.svg',
  authors: ['hazemadelkhalel'],
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  actions: [createTodo, waitForApproval, createTodoAndWait],
  triggers: [],
});
