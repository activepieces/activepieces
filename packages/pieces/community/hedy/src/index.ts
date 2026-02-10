import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { hedyAuth } from './lib/auth';
import {
  getSession,
  listSessions,
  getHighlight,
  listHighlights,
  listTodos,
  listSessionTodos,
  getTopic,
  listTopics,
  listTopicSessions,
} from './lib/actions';
import {
  sessionCreated,
  sessionEnded,
  highlightCreated,
  todoExported,
} from './lib/triggers';

export const hedy = createPiece({
  displayName: 'Hedy',
  description: 'AI-powered meeting intelligence – be the brightest person in the room.',
  auth: hedyAuth,
  minimumSupportedRelease: '0.69.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hedy.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['HedyAI'],
  actions: [
    getSession,
    listSessions,
    getHighlight,
    listHighlights,
    listTodos,
    listSessionTodos,
    getTopic,
    listTopics,
    listTopicSessions,
  ],
  triggers: [sessionCreated, sessionEnded, highlightCreated, todoExported],
});
