import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { callMethod } from './lib/actions/call-method';
import { soapAuth } from './lib/shared/auth';

export const soap = createPiece({
  displayName: 'SOAP',
  auth: soapAuth(),
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/soap.png',
  authors: ['x7airworker'],
  categories: [PieceCategory.OTHER],
  actions: [callMethod],
  triggers: [],
});
