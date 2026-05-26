import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTaskAction } from './lib/actions/create-task.action';
import { PieceCategory } from '@activepieces/shared';
import { completeTaskAction } from './lib/actions/complete-task.action';
import { deleteTaskAction } from './lib/actions/delete-task.action';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { taskadeAuth } from './lib/auth';

export const taskade = createPiece({
	displayName: 'Taskade',
	auth: taskadeAuth,
	minimumSupportedRelease: '0.30.0',
	categories: [PieceCategory.PRODUCTIVITY],
	description: 'collaboration platform for remote teams to organize and manage projects',
	logoUrl: 'https://cdn.activepieces.com/pieces/taskade.png',
	authors: ['kishanprmr'],
	actions: [
		createTaskAction,
		completeTaskAction,
		deleteTaskAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://www.taskade.com/api/v1',
			auth: taskadeAuth,
			authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
		}),
	],
	triggers: [],
});
