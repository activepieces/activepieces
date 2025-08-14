import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { customApiCall } from './lib/actions/custom-api-call';
import { OOO } from './lib/actions/ooo';
import { updateOOO } from './lib/actions/update-OOO';
import { deleteOOO } from './lib/actions/delete-OOO';
import { addShift } from './lib/actions/add-shift';
import { scheduleUpdated } from './lib/triggers/schedule-updated';
import { timeOffStatusChanged } from './lib/triggers/OOO-status-changed';
import { newTimeOffRequest } from './lib/triggers/new-OOO-request';

export const assembledAuth = PieceAuth.SecretText({
  displayName: 'Assembled API Key',
  description: 'Enter your Assembled API key (Bearer token)',
  required: true,
});
export const assembled = createPiece({
  displayName: 'Assembled',
  description: 'Workforce management platform for scheduling and forecasting',
  auth: assembledAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://assembled.com/favicon.ico',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.HUMAN_RESOURCES],
  authors: [],
  actions: [
    customApiCall,
    OOO,
    addShift,
    updateOOO,
    deleteOOO,
  ],
  triggers: [
    newTimeOffRequest,
    timeOffStatusChanged,
    scheduleUpdated,
  ],
});