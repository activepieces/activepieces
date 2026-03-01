import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { linearCreateComment } from './lib/actions/comments/create-comment';
import { linearCreateIssue } from './lib/actions/issues/create-issue';
import { linearUpdateIssue } from './lib/actions/issues/update-issue';
import { linearCreateProject } from './lib/actions/projects/create-project';
import { linearUpdateProject } from './lib/actions/projects/update-project';
import { linearRawGraphqlQuery } from './lib/actions/raw-graphql-query';
import { linearNewIssue } from './lib/triggers/new-issue';
import { linearUpdatedIssue } from './lib/triggers/updated-issue';
import { linearRemovedIssue } from './lib/triggers/removed-issue';

const markdown = `
To obtain your API key, follow these steps:

1. Go to settings by clicking your profile-pic (top-left)
2. Go to API section inside My Account.
3. On Personal API keys, give label and press create key.`;

export const linearAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
  validate: async ({ auth }) => {
    if (auth.startsWith('lin_api_')) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Invalid API Key',
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
  triggers: [linearNewIssue, linearUpdatedIssue, linearRemovedIssue],
});
