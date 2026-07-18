import {
  createPiece,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { wauldAuth } from './lib/auth';
import { listWorkspaces } from './lib/actions/list-workspaces';

export const wauld = createPiece({
  displayName: 'Wauld',
  description:
    'Create, issue, and automate verifiable digital credentials.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wauld.png',
  authors: ['vikranthreddy86'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: wauldAuth,
  actions: [listWorkspaces],
  triggers: [],
});