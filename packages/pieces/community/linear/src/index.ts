import { createPiece, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { LinearClient } from '@linear/sdk';
import { linearCreateComment } from './lib/actions/comments/create-comment';
import { linearCreateIssue } from './lib/actions/issues/create-issue';
import { linearUpdateIssue } from './lib/actions/issues/update-issue';
import { linearCreateProject } from './lib/actions/projects/create-project';
import { linearUpdateProject } from './lib/actions/projects/update-project';
import { linearRawGraphqlQuery } from './lib/actions/raw-graphql-query';
import { linearNewComment } from './lib/triggers/new-comment';
import { linearNewIssue } from './lib/triggers/new-issue';
import { linearUpdatedIssue } from './lib/triggers/updated-issue';
import { linearRemovedIssue } from './lib/triggers/removed-issue';
import { linearNewProject } from './lib/triggers/new-project';
import { linearUpdatedProject } from './lib/triggers/updated-project';
import { linearRemovedProject } from './lib/triggers/removed-project';

const markdown = `
To obtain your API key, follow these steps:

1. Go to settings by clicking your profile-pic (top-left)
2. Go to Security & Access section
3. On Personal API keys, give label and press create key.`;

export const linearAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
  validate: async ({ auth }) => {
    if (!auth.startsWith('lin_api_')) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
    const { error } = await tryCatch(() => new LinearClient({ apiKey: auth }).viewer);
    if (!error) {
      return {
        valid: true,
      };
    }
    if (isUnauthorized(error)) {
      return {
        valid: false,
        error: 'Linear did not accept this API key. It may have been revoked or rotated. Create a new personal API key under Settings, Security & access in Linear, then try again.',
      };
    }
    return {
      valid: false,
      error: 'Could not reach Linear to check this API key. Please try again.',
    };
  },
});
export const linear = createPiece({
  displayName: 'Linear',
  description: 'Issue tracking for modern software teams',

  auth: linearAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/linear.png',
  authors: ['lldiegon', 'kishanprmr', 'abuaboud'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    linearCreateIssue,
    linearUpdateIssue,
    linearCreateProject,
    linearUpdateProject,
    linearCreateComment,
    linearRawGraphqlQuery,
  ],
  triggers: [
    linearNewComment,
    linearNewIssue,
    linearUpdatedIssue,
    linearRemovedIssue,
    linearNewProject,
    linearUpdatedProject,
    linearRemovedProject,
  ],
});

function isUnauthorized(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
}
