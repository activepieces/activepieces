import {
  createPiece,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { wauldAuth } from './lib/auth';
import { listWorkspaces } from './lib/actions/list-workspaces';
import { listEngagements } from './lib/actions/list-engagements';
import { listDocuments } from './lib/actions/list-documents';
import { issueCredential } from './lib/actions/issue-credential';
import { credentialIssued } from './lib/triggers/credential-issued';

export const wauld = createPiece({
  displayName: 'Wauld',
  description:
    'Create, issue, and automate verifiable digital credentials.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wauld.png',
  authors: ['vikranthreddy86'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: wauldAuth,
  actions: [
    listWorkspaces,
    listEngagements,
    listDocuments,
    issueCredential,
    createCustomApiCallAction({
      auth: wauldAuth,
      baseUrl: () => 'https://wauld.app',
      authMapping: async (auth) => ({
        Authorization:
          `Bearer ${auth.props.accessToken}`,
        'Connect-Protocol-Version': '1',
      }),
    }),
  ],
  triggers: [credentialIssued],
});