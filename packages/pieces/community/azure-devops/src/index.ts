import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

export const azureDevOps = createPiece({
  displayName: 'Azure DevOps',
  description: 'Track work, code, and ship software with Azure Boards, Repos, and Pipelines.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-devops.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: undefined,
  authors: ['majewskibartosz'],
  actions: [],
  triggers: [],
});
