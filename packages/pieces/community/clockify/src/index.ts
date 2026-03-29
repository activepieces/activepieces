import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { clockifyAuth } from './lib/auth';
import {
  createTimeEntry,
  startTimeEntry,
  stopTimer,
  findTask,
  getTimeEntries,
} from './lib/actions';
import {
  newTimeEntryTrigger,
  newTaskTrigger,
  newTimerStartedTrigger,
} from './lib/triggers';

export const clockify = createPiece({
  displayName: 'Clockify',
  description: 'Time tracking and productivity platform - Track time, manage tasks, and generate detailed reports',
  logoUrl: 'https://cdn.clockify.me/assets/logo/clockify-logo.svg',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['ktwo'],
  auth: clockifyAuth,
  minimumSupportedRelease: '1.0.0',
  actions: [
    createTimeEntry,
    startTimeEntry,
    stopTimer,
    findTask,
    getTimeEntries,
  ],
  triggers: [
    newTimeEntryTrigger,
    newTaskTrigger,
    newTimerStartedTrigger,
  ],
});
