import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { vercelAuth } from './lib/common/auth';
import {
  createDeployment,
  getDeploymentStatus,
  listEnvironmentVariables,
  listProjects,
  upsertEnvironmentVariable,
} from './lib/actions';

export const vercel = createPiece({
  displayName: 'Vercel',
  auth: vercelAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vercel.png',
  description: 'Deploy projects and manage environment variables on Vercel.',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['atlas-hunter'],
  actions: [
    listProjects,
    createDeployment,
    getDeploymentStatus,
    listEnvironmentVariables,
    upsertEnvironmentVariable,
    createCustomApiCallAction({
      auth: vercelAuth,
      baseUrl: () => 'https://api.vercel.com',
      description:
        'Make a custom API call to Vercel. The Authorization header is injected automatically. If your connection uses Team ID or Team Slug, add `teamId` or `slug` manually in the URL or Query Parameters for team-scoped requests.',
      props: {
        queryParams: {
          description:
            'Optional query parameters. For team-scoped requests, manually include `teamId` or `slug` here when needed.',
        },
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.token}`,
      }),
    }),
  ],
  triggers: [],
});
