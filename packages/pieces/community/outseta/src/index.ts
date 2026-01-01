import { createPiece } from '@activepieces/pieces-framework';
import { outsetaAuth } from './auth';

export const outseta = createPiece({
  name: 'outseta',
  displayName: 'Outseta',
  description: 'Triggers and actions for Outseta CRM and Billing',
  auth: outsetaAuth,
  minimumSupportedRelease: '0.20.0',
  triggers: [],
  actions: [],
});
