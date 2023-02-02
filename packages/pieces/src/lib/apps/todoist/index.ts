import {createPiece} from '../../framework/piece';
import { todoistCreateTaskAction } from './actions/create-task-action';

export const todoist = createPiece({
	name: 'todoist',
	displayName: 'Todoist',
	logoUrl: 'https://cdn.activepieces.com/pieces/todist.png',
	actions: [
    todoistCreateTaskAction,
  ],
	triggers: [
  ],
});
