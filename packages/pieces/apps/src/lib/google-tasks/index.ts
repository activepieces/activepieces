import { createPiece } from '@activepieces/framework';
import { googleTasksAddNewTaskAction } from './actions/new-task';

export const googleTasks = createPiece({
	name: 'google_tasks',
	logoUrl: 'https://fonts.gstatic.com/s/i/productlogos/tasks/v10/web-64dp/logo_tasks_color_2x_web_64dp.png',
	actions: [googleTasksAddNewTaskAction],
	displayName: "Google Tasks",
	authors: ['abaza738'],
	triggers: [],
});
