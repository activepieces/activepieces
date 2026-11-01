import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { createTaskAction } from './lib/actions/create-task';
import { createTimeEntryAction } from './lib/actions/create-time-entry';
import { findRunningTimerAction } from './lib/actions/find-running-timer';
import { findTaskAction } from './lib/actions/find-task';
import { findTimeEntryAction } from './lib/actions/find-time-entry';
import { startTimerAction } from './lib/actions/start-timer';
import { stopTimerAction } from './lib/actions/stop-timer';
import { clockifyClient } from './lib/common/client';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newTimeEntryTrigger } from './lib/triggers/new-time-entry';
import { newTimerStartedTrigger } from './lib/triggers/new-timer-started';
import { clockifyAiActions } from './lib/actions/ai';
import { clockifyAuth } from './lib/auth';

export const clockify = createPiece({
	displayName: 'Clockify',
	auth: clockifyAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/clockify.png',
	authors: ['rimjhimyadav', 'kishanprmr'],
	actions: [
		createTaskAction,
		createTimeEntryAction,
		startTimerAction,
		stopTimerAction,
		findTaskAction,
		findTimeEntryAction,
		findRunningTimerAction,
		...clockifyAiActions,
		createCustomApiCallAction({
			auth: clockifyAuth,
			baseUrl: () => clockifyClient.baseUrl(),
			authMapping: async (auth) => {
				return {
					'X-Api-Key': auth.secret_text,
				};
			},
		}),
	],
	triggers: [newTaskTrigger, newTimeEntryTrigger, newTimerStartedTrigger],
});
