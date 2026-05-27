import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { ackpostAuth } from './lib/common/auth';
import { createDraft } from './lib/actions/create-draft';
import { publishDraft } from './lib/actions/publish-draft';
import { createBlog } from './lib/actions/create-blog';
import { newProof } from './lib/triggers/new-proof';

export const ackpost = createPiece({
  displayName: 'AckPost',
  description: 'Proof-backed social publishing for teams that need approvals, proof, and no silent failures.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://ackpost.com/favicon.ico',
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  authors: ['AckPost'],
  auth: ackpostAuth,
  actions: [createDraft, publishDraft, createBlog],
  triggers: [newProof],
});
