import { createPiece } from '@activepieces/pieces-framework';
import { todoistCreateTaskAction } from './lib/actions/create-task-action';
import { todoistTaskCompletedTrigger } from './lib/triggers/task-completed-trigger';

export const todoist = createPiece({
	displayName: 'Todoist',
	logoUrl: 'https://cdn.activepieces.com/pieces/todoist.png',
	authors: ['khaledmashaly'],
	actions: [todoistCreateTaskAction],
	triggers: [
		todoistTaskCompletedTrigger,
	],
});
