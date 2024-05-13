import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { todoistCreateTaskAction } from './lib/actions/create-task-action';
import { todoistTaskCompletedTrigger } from './lib/triggers/task-completed-trigger';
import { todoistUpdateTaskAction } from './lib/actions/update-task.action';
import { todoistFindTaskAction } from './lib/actions/find-task.action';
import { todoistMarkTaskCompletedAction } from './lib/actions/mark-task-completed.action';

export const todoistAuth = PieceAuth.OAuth2({
	required: true,
	authUrl: 'https://todoist.com/oauth/authorize',
	tokenUrl: 'https://todoist.com/oauth/access_token',
	scope: ['data:read_write'],
});

export const todoist = createPiece({
	displayName: 'Todoist',
	description: 'To-do list and task manager',
	minimumSupportedRelease: '0.5.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/todoist.png',
	authors: ['MyWay', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
	categories: [PieceCategory.PRODUCTIVITY],
	auth: todoistAuth,
	actions: [
		todoistCreateTaskAction,
		todoistUpdateTaskAction,
		todoistFindTaskAction,
		todoistMarkTaskCompletedAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.todoist.com/rest/v2',
			auth: todoistAuth,
			authMapping: (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [todoistTaskCompletedTrigger],
});
