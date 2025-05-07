import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { runWorkflowAction } from './lib/actions/run-workflow';
import { getWorkflowRunStatusAction } from './lib/actions/get-workflow-run-status';
import { getWorkflowRunOutputsAction } from './lib/actions/get-workflow-run-outputs';
import { workflowRunCompletedTrigger } from './lib/triggers/workflow-run-completed';

const markdownDescription = `
To use Copy AI, you need to get an API key:
1. Login to your account at https://copy.ai.
2. Click on Workflows in the left sidebar.
3. Click on any Workflow you have. You need to create a new Workflow, if you don't have one.
4. Click on the API tab.
5. Click the Copy button below WORKSPACE API KEY.
`;

export const copyAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: markdownDescription,
	required: true,
});

export const copyAi = createPiece({
	displayName: 'Copy.ai',
	description: 'AI-powered content generation and copywriting platform',
	logoUrl: 'https://cdn.activepieces.com/pieces/copy-ai.png',
	authors: ['AnkitSharmaOnGithub'],
	auth: copyAiAuth,
	actions: [runWorkflowAction, getWorkflowRunStatusAction, getWorkflowRunOutputsAction],
	triggers: [workflowRunCompletedTrigger],
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
});
