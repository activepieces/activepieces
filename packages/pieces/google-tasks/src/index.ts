import { createPiece } from '@activepieces/pieces-framework';
import { googleTasksAddNewTaskAction } from './lib/actions/new-task';

export const googleTasks = createPiece({
	logoUrl: 'https://cdn.activepieces.com/pieces/google-tasks.png',
	actions: [googleTasksAddNewTaskAction],
	displayName: "Google Tasks",
	authors: ['abaza738'],
	triggers: [],
});
