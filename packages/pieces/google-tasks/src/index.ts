import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { googleTasksAddNewTaskAction } from './lib/actions/new-task';

export const googleTasksAuth = PieceAuth.OAuth2({
    description: "",
    displayName: 'Authentication',
    authUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    required: true,
    scope: ["https://www.googleapis.com/auth/tasks"]
})

export const googleTasks = createPiece({
	logoUrl: 'https://cdn.activepieces.com/pieces/google-tasks.png',
	actions: [googleTasksAddNewTaskAction],
	displayName: "Google Tasks",
	authors: ['abaza738'],
	triggers: [],
    auth: googleTasksAuth,
});
