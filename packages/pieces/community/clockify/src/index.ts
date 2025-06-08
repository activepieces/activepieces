import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTaskAction } from './lib/actions/create-task';
import { createTimeEntryAction } from './lib/actions/create-time-entry';
import { findRunningTimerAction } from './lib/actions/find-running-timer';
import { findTaskAction } from './lib/actions/find-task';
import { findTimeEntryAction } from './lib/actions/find-time-entry';
import { startTimerAction } from './lib/actions/start-timer';
import { stopTimerAction } from './lib/actions/stop-timer';
import { BASE_URL } from './lib/common';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newTimeEntryTrigger } from './lib/triggers/new-time-entry';
import { newTimerStartedTrigger } from './lib/triggers/new-timer-started';

export const clockifyAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
});

export const clockify = createPiece({
	displayName: 'Clockify',
	auth: clockifyAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/clockify.png',
	authors: ['rimjhimyadav'],
	actions: [
		createTaskAction,
		createTimeEntryAction,
		startTimerAction,
		stopTimerAction,
		findTaskAction,
		findTimeEntryAction,
		findRunningTimerAction,
		createCustomApiCallAction({
			auth: clockifyAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					'X-Api-Key': auth as string,
				};
			},
		}),
	],
	triggers: [newTaskTrigger,newTimeEntryTrigger,newTimerStartedTrigger],
});
