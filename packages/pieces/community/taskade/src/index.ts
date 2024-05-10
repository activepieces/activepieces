import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTaskAction } from './lib/actions/create-task.action';
import { PieceCategory } from '@activepieces/shared';
import { completeTaskAction } from './lib/actions/complete-task.action';

export const taskadeAuth = PieceAuth.SecretText({
	displayName: 'Personal Token',
	required: true,
	description: `
	1. Navigate to https://taskade.com/settings/password and scroll down to Personal Access Tokens.
	2. Create your personal access token with any name.`,
});

export const taskade = createPiece({
	displayName: 'Taskade',
	auth: taskadeAuth,
	minimumSupportedRelease: '0.20.0',
	categories: [PieceCategory.PRODUCTIVITY],
	description: 'collaboration platform for remote teams to organize and manage projects',
	logoUrl: 'https://cdn.activepieces.com/pieces/taskade.png',
	authors: ['kishanprmr'],
	actions: [createTaskAction, completeTaskAction],
	triggers: [],
});
