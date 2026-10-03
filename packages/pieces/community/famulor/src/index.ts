import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { famulorAuth } from './lib/auth';
import { apiOperation, nativeActions } from './lib/actions/api-operation';
import { customApiCall } from './lib/actions/custom-api-call';
import { pollingTriggers } from './lib/triggers/polling';

export const famulor = createPiece({
  displayName: 'Famulor AI - Voice Agent',
  auth: famulorAuth,
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://www.famulor.io/logo/png-icon/mark-512x512.png',
  description: 'Automate voice calls, campaigns, contacts, messaging, bookings and knowledge with the Famulor workspace API.',
  authors: ['bekservice', 'onyedikachi-david'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [...nativeActions, apiOperation, customApiCall],
  triggers: pollingTriggers,
});
