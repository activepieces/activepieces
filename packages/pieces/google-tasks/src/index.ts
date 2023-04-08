import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { googleTasksAddNewTaskAction } from './lib/actions/new-task';

export const googleTasks = createPiece({
	name: 'google-tasks',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-tasks.png',
	actions: [googleTasksAddNewTaskAction],
	displayName: "Google Tasks",
	authors: ['abaza738'],
	triggers: [],
  version: packageJson.version,
});
