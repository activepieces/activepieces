import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createWorkItemAction } from './lib/actions/create-work-item';
import { getWorkItemAction } from './lib/actions/get-work-item';
import { updateWorkItemAction } from './lib/actions/update-work-item';
import { listWorkItemsAction } from './lib/actions/list-work-items';
import { addCommentAction } from './lib/actions/add-comment';
import { newUpdatedWorkItemTrigger } from './lib/triggers/new-updated-work-item';
import { newUpdatedWorkItemWebhookTrigger } from './lib/triggers/new-updated-work-item-webhook';
import { azureDevOpsAuth, azureDevOpsCommon } from './lib/common';
import type { AzureDevOpsAuth } from './lib/common';

export { azureDevOpsAuth };
export type { AzureDevOpsAuth };

export const azureDevOps = createPiece({
  displayName: 'Azure DevOps',
  description: 'Track work, code, and ship software with Azure Boards, Repos, and Pipelines.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-devops.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: azureDevOpsAuth,
  authors: ['majewskibartosz'],
  actions: [
    createWorkItemAction,
    getWorkItemAction,
    updateWorkItemAction,
    listWorkItemsAction,
    addCommentAction,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        azureDevOpsCommon.sanitizeOrgUrl(
          azureDevOpsCommon.asAuth(auth).props.organizationUrl,
        ),
      auth: azureDevOpsAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `:${azureDevOpsCommon.asAuth(auth).props.pat}`,
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: [newUpdatedWorkItemWebhookTrigger, newUpdatedWorkItemTrigger],
});
