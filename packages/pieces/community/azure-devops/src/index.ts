import {
  createPiece,
  PieceAuth,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

const authDescription = `To get your Personal Access Token (PAT):

1. Go to **Azure DevOps** and click your profile icon (top-right)
2. Select **Personal access tokens**
3. Click **+ New Token**
4. Give it a name and set expiration
5. Under **Scopes**, select:
   - **Work Items**: Read & Write
   - **Project and Team**: Read
6. Click **Create** and copy the token (you won't see it again)

**Organization URL** is your Azure DevOps URL, e.g. \`https://dev.azure.com/mycompany\``;

export const azureDevOpsAuth = PieceAuth.CustomAuth({
  description: authDescription,
  required: true,
  props: {
    organizationUrl: Property.ShortText({
      displayName: 'Organization URL',
      description: 'Your Azure DevOps organization URL (e.g. https://dev.azure.com/mycompany)',
      required: true,
    }),
    pat: PieceAuth.SecretText({
      displayName: 'Personal Access Token',
      description: 'Your Azure DevOps PAT with Work Items (Read & Write) and Project and Team (Read) scopes.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const orgUrl = auth.organizationUrl.replace(/\/+$/, '');
    const encoded = Buffer.from(`:${auth.pat}`).toString('base64');
    try {
      const response = await httpClient.sendRequest<ProjectListResponse>({
        method: HttpMethod.GET,
        url: `${orgUrl}/_apis/projects`,
        headers: { Authorization: `Basic ${encoded}` },
        queryParams: { 'api-version': '7.1' },
      });
      if (response.body.value !== undefined) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid PAT or Organization URL' };
    } catch {
      return { valid: false, error: 'Invalid PAT or Organization URL' };
    }
  },
});

export const azureDevOps = createPiece({
  displayName: 'Azure DevOps',
  description: 'Track work, code, and ship software with Azure Boards, Repos, and Pipelines.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-devops.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: azureDevOpsAuth,
  authors: ['majewskibartosz'],
  actions: [],
  triggers: [],
});

interface ProjectListResponse {
  count: number;
  value: Array<{
    id: string;
    name: string;
    state: string;
  }>;
}

export type AzureDevOpsAuth = AppConnectionValueForAuthProperty<typeof azureDevOpsAuth>;
