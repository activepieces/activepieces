import {
  createPiece,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { wauldAuth } from './lib/auth';
import { issueCredential } from './lib/actions/issue-credential';
import { credentialIssued } from './lib/triggers/credential-issued';

export const wauld = createPiece({
  displayName: 'Wauld',
  description:
    'Wauld is an all-in-one credentialing platform to design, issue, and manage digital credentials that are secure, shareable, and globally verifiable.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wauld.png',
  authors: ['vikranthreddy86'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: wauldAuth,
  actions: [
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