import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  createTaskAction,
  createTimeEntryAction,
  startTimerAction,
  stopTimerAction,
  findTaskAction,
  findTimeEntryAction,
  findRunningTimerAction,
} from './lib/actions';
import { newTaskTrigger, newTimeEntryTrigger, newTimerStartedTrigger } from './lib/triggers';

export const clockifyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Find your Clockify API key in Profile > Settings > API.',
});

export const clockify = createPiece({
  displayName: 'Clockify',
  description: 'Track time, manage projects and tasks via Clockify',
  auth: clockifyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/clockify.png',
  
  authors: ['krushnarout'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [createTaskAction, createTimeEntryAction, startTimerAction, stopTimerAction, findTaskAction, findTimeEntryAction, findRunningTimerAction],
  triggers: [newTaskTrigger, newTimeEntryTrigger, newTimerStartedTrigger],
});
