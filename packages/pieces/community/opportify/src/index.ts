import { createPiece } from '@activepieces/pieces-framework';
import { opportifyAuth } from './lib/common/auth';
import { analyzeEmailAction } from './lib/actions/analyze-email';
import { analyzeIpAddressAction } from './lib/actions/analyze-ip-address';

export const opportify = createPiece({
  displayName: 'Opportify',
  auth: opportifyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/opportify.png',
  authors: [],
  actions: [analyzeEmailAction, analyzeIpAddressAction],
  triggers: [],
});
