import { createPiece } from '../../framework/piece';
import { custifyAssignNpsAction } from './actions/assign-nps-action';

export const custify = createPiece({
  name: 'custify',
  displayName: 'Custify',
  logoUrl: 'https://cdn.activepieces.com/pieces/custify.png',
  actions: [
    custifyAssignNpsAction,
  ],
  triggers: [
  ],
});
