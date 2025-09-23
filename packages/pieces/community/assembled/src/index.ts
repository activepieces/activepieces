import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { customApiCall } from './lib/actions/custom-api-call';
import { customGraphql } from './lib/actions/custom-graphql';
import { OOO } from './lib/actions/ooo';
import { updateOOO } from './lib/actions/update-OOO';
import { deleteOOO } from './lib/actions/delete-OOO'
import { addShift } from './lib/actions/add-shift';
import { scheduleUpdated } from './lib/triggers/schedule-updated';
import { timeOffStatusChanged } from './lib/triggers/OOO-status-changed';
import { newTimeOffRequest } from './lib/triggers/new-OOO-request';
import { assembledAuth } from './lib/common/auth';

export const assembled = createPiece({
  displayName: 'Assembled',
  description: 'Workforce management platform for scheduling and forecasting',
  auth: assembledAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/assembled.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.HUMAN_RESOURCES],
  authors: ['meenulekha-premakumar'],
  actions: [
    customApiCall,
    customGraphql,
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