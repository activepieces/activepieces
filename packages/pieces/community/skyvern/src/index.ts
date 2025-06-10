import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { cancelWorkflowRun } from './lib/actions/cancel-workflow-run';
import { getAWorkflowRunById } from './lib/actions/get-a-workflow-run-by-id';
import { getAgentTaskRun } from './lib/actions/get-agent-task-run';
import { runWorkflow } from './lib/actions/run-workflow';
import { runAgentTask } from './lib/actions/run-agent-task';
import { findWorkflow } from './lib/actions/find-workflow';

const Markdown = `
To obtain your Skyvern API Key, follow these steps:

1. Navigate to [https://app.skyvern.com/]
2. Go to the **Settings** section.
3. Select the **API Keys** tab.
4. Click **Reveal** to view your API Key.
5. Copy the API Key for use.
`;

export const skyVernAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: Markdown,
});

export const skyvern = createPiece({
  displayName: 'Skyvern',
  auth: skyVernAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/skyvern.png',
  authors: ["SaikiranSurapalli17"],
  actions: [
    cancelWorkflowRun,
    getAWorkflowRunById,
    getAgentTaskRun,
    runWorkflow,
    runAgentTask,
    findWorkflow,
  ],
  triggers: [],
});
