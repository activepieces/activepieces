import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { runWorkflow } from './lib/actions/run-workflow';
import { getWorkflowRunStatus } from './lib/actions/get-workflow-run-status';
import { getWorkflowRunOutputs } from './lib/actions/get-workflow-run-outputs';
import { workflowRunCompleted } from './lib/triggers/workflow-run-completed';

const markdownDescription = `
To use Copy AI, you need to get an API key:
1. Login to your account at https://copy.ai.
2. Click on Workflows in the left sidebar.
3. Click on any Workflow you have. You need to create a new Workflow, if you don't have one.
4. Click on the API tab.
5. Click the Copy button below WORKSPACE API KEY.
`;

export const copyAi = createPiece({
    displayName: 'Copy AI',
    description: 'AI-powered content generation and copywriting platform',
    logoUrl: 'https://cdn.prod.website-files.com/628288c5cd3e8411b90a36a4/6797ee68ae7908e605a9a4d0_copy_logo-all-dark.svg',
    authors: ['AnkitSharmaOnGithub'],
    auth: PieceAuth.SecretText({
        displayName: 'API Key',
        description: markdownDescription,
        required: true,
    }),
    actions: [
        runWorkflow,
        getWorkflowRunStatus,
        getWorkflowRunOutputs
    ],
    triggers: [
        workflowRunCompleted
    ],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
});
