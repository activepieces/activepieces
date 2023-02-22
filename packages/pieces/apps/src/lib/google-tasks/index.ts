import { createPiece } from '@activepieces/framework';
import { googleTasksAddNewTaskAction } from './actions/new-task';

export const googleTasks = createPiece({
	name: 'google_tasks',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_tasks.png',
	actions: [googleTasksAddNewTaskAction],
	displayName: "Google Tasks",
	authors: ['abaza738'],
	triggers: [],
});
