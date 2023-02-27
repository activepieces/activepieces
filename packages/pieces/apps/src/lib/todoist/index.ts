import {createPiece} from '@activepieces/framework';
import { todoistCreateTaskAction } from './actions/create-task-action';
import { todoistTaskCompletedTrigger } from './triggers/task-completed-trigger';

export const todoist = createPiece({
	name: 'todoist',
	displayName: 'Todoist',
	logoUrl: 'https://cdn.activepieces.com/pieces/todoist.png',
  version: '0.0.0',
	authors: ['khaledmashaly'],
	actions: [todoistCreateTaskAction],
	triggers: [
    todoistTaskCompletedTrigger,
  ],
});
