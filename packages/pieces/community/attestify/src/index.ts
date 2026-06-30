import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { issueCertificate } from './lib/actions/issue-certificate';

export const attestify = createPiece({
  displayName: 'Attestify',
  description:
    'Issue tamper-evident verifiable certificates from any workflow. Every certificate gets a permanent public verify page anyone can check — no account needed — backed by an Ed25519 signature. Recipient PII is never stored.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/attestify.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.HUMAN_RESOURCES],
  authors: ['novadyne-hq'],
  actions: [issueCertificate],
  triggers: [],
});
