import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';
import { createTaskListAction } from './lib/actions/create-task-list';
import { updateTaskAction } from './lib/actions/update-task';
import { findTaskListByNameAction } from './lib/actions/find-task-list-by-name';
import { findTaskByTitleAction } from './lib/actions/find-task-by-title';
import { newTaskCreatedTrigger } from './lib/triggers/new-task-created';
import { newOrUpdatedTaskTrigger } from './lib/triggers/task-updated';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const microsoftToDoAuth = PieceAuth.OAuth2({
	description:
		'Authenticate with your Microsoft Account. You will need to register an application in the Microsoft Entra admin center.Add **Tasks.ReadWrite**,**User.Read**, **offline_access** scopes.',
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	required: true,
	scope: ['Tasks.ReadWrite', 'User.Read', 'offline_access'],
});

export const microsoftTodo = createPiece({
	displayName: 'Microsoft To Do',
	description: 'Cloud based task management application.',
	categories: [PieceCategory.PRODUCTIVITY],
	auth: microsoftToDoAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-todo.png',
	authors: ['onyedikachi-david'],
	actions: [
		createTask,
		createTaskListAction,
		updateTaskAction,
		findTaskListByNameAction,
		findTaskByTitleAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://graph.microsoft.com/v1.0/me/todo',
			auth: microsoftToDoAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [newTaskCreatedTrigger, newOrUpdatedTaskTrigger],
});
