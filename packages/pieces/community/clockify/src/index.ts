import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createTask } from './lib/actions/create-task';
import { createTimeEntry } from './lib/actions/create-time-entry';
import { startTimer } from './lib/actions/start-timer';
import { stopTimer } from './lib/actions/stop-timer';
import { findTask } from './lib/actions/find-task';
import { findTimeEntry } from './lib/actions/find-time-entry';
import { findRunningTimer } from './lib/actions/find-running-timer';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newTimeEntryTrigger } from './lib/triggers/new-time-entry';
import { newTimerStartedTrigger } from './lib/triggers/new-timer-started';

const markdownDescription = `
To use Clockify, you need to get an API key:
1. Login to your Clockify account at https://clockify.me/
2. Go to your Profile page by clicking on your username in the top-right corner
3. Click on "Profile Settings"
4. Scroll down to the "API" section
5. Generate a new API key by clicking the "Generate" button
`;

export const clockifyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const clockify = createPiece({
  displayName: 'Clockify',
  description: 'Time tracking and productivity platform for individuals and teams',
  logoUrl: 'https://cdn.activepieces.com/pieces/clockify.png',
  authors: ['AnkitSharmaOnGithub'],
  auth: clockifyAuth,
  actions: [
    createTask,
    createTimeEntry,
    startTimer,
    stopTimer,
    findTask,
    findTimeEntry,
    findRunningTimer
  ],
  triggers: [
    newTaskTrigger,
    newTimeEntryTrigger,
    newTimerStartedTrigger
  ],
  categories: [PieceCategory.PRODUCTIVITY],
});
