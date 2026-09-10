import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addWorksheetRowAction } from './lib/actions/add-worksheet-row';
import { createOutboundCallAction } from './lib/actions/create-outbound-call';
import { findWorksheetRowsAction } from './lib/actions/find-worksheet-rows';
import { getInteractionAction } from './lib/actions/get-interaction';
import { listAgentsAction } from './lib/actions/list-agents';
import { listLocationsAction } from './lib/actions/list-locations';
import { readWorksheetRowsAction } from './lib/actions/read-worksheet-rows';
import { updateWorksheetRowAction } from './lib/actions/update-worksheet-row';
import { kickcallAuth } from './lib/auth';

export const kickcall = createPiece({
  displayName: 'Kickcall',
  description:
    'AI voice agents for inbound and outbound phone calls, powered by Kickcall.',
  minimumSupportedRelease: '0.82.0',
  logoUrl:
    'https://cdn.prod.website-files.com/682d8301273c463d4ba65443/6a6b37e2a5be9b3855f11fdf_Kickcall%20White%20Background.svg',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: kickcallAuth,
  authors: ['Vishal'],
  actions: [
    createOutboundCallAction,
    getInteractionAction,
    listLocationsAction,
    listAgentsAction,
    addWorksheetRowAction,
    readWorksheetRowsAction,
    findWorksheetRowsAction,
    updateWorksheetRowAction,
  ],
  triggers: [],
});
