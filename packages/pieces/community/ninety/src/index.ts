import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { ninetyAuth } from './lib/auth';
import { createIssue } from './lib/actions/create-issue';
import { createMilestone } from './lib/actions/create-milestone';
import { createRock } from './lib/actions/create-rock';
import { createTodo } from './lib/actions/create-todo';
import { findIssues } from './lib/actions/find-issues';
import { findMeasurables } from './lib/actions/find-measurables';
import { findRocks } from './lib/actions/find-rocks';
import { findTodos } from './lib/actions/find-todos';
import { listTeams } from './lib/actions/list-teams';
import { setMeasurableScore } from './lib/actions/set-measurable-score';
import { updateIssue } from './lib/actions/update-issue';
import { updateRock } from './lib/actions/update-rock';
import { updateTodo } from './lib/actions/update-todo';
import { NINETY_BASE_URL } from './lib/common/client';
import { newIssue } from './lib/triggers/new-issue';
import { newRock } from './lib/triggers/new-rock';
import { newTodo } from './lib/triggers/new-todo';

export const ninety = createPiece({
  displayName: 'Ninety',
  description:
    'Run the EOS operating system in Ninety: to-dos, issues, rocks, milestones and the scorecard',
  auth: ninetyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ninety.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['OdaiAhmed99'],
  actions: [
    createTodo,
    updateTodo,
    findTodos,
    createIssue,
    updateIssue,
    findIssues,
    createRock,
    updateRock,
    findRocks,
    createMilestone,
    findMeasurables,
    setMeasurableScore,
    listTeams,
    createCustomApiCallAction({
      auth: ninetyAuth,
      baseUrl: () => NINETY_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text.trim()}`,
      }),
    }),
  ],
  triggers: [newTodo, newIssue, newRock],
});
