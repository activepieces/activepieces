import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { todoistCreateTaskAction } from './lib/actions/create-task-action';
import { todoistTaskCompletedTrigger } from './lib/triggers/task-completed-trigger';

export const todoist = createPiece({
	name: 'todoist',
	displayName: 'Todoist',
	logoUrl: 'https://cdn.activepieces.com/pieces/todoist.png',
	version: packageJson.version,
	authors: ['khaledmashaly'],
	actions: [todoistCreateTaskAction],
	triggers: [
		todoistTaskCompletedTrigger,
	],
});
