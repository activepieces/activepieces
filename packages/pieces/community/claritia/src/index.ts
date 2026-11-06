import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addToWorkflow } from './lib/actions/add-to-workflow';
import { findFill } from './lib/actions/find-fill';
import { claritiaAuth } from './lib/auth';
import { CLARITIA_BASE } from './lib/common';
import { bookingCanceled, leadRouted, newBooking, newFill } from './lib/triggers';

export const claritia = createPiece({
  displayName: 'Claritia',
  description: 'Forms that turn visitors into leads, meetings that book them, and workflows that follow up.',
  auth: claritiaAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: `${CLARITIA_BASE}/icon.svg`,
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ['claritia'],
  actions: [findFill, addToWorkflow],
  triggers: [newFill, newBooking, bookingCanceled, leadRouted],
});
