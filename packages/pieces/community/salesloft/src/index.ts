import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { salesloftAuth } from './lib/auth';
import { SALESLOFT_API_BASE } from './lib/common/client';
import { createCadenceMembershipAction } from './lib/actions/create-cadence-membership';
import { createNoteAction } from './lib/actions/create-note';
import { createPersonAction } from './lib/actions/create-person';
import { getPersonAction } from './lib/actions/get-person';
import { listCadencesAction } from './lib/actions/list-cadences';
import { listPeopleAction } from './lib/actions/list-people';
import { updatePersonAction } from './lib/actions/update-person';

export const salesloft = createPiece({
  displayName: 'Salesloft',
  description:
    'Sales engagement platform for cadences, people, and revenue workflows.',
  auth: salesloftAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesloft.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createPersonAction,
    updatePersonAction,
    getPersonAction,
    listPeopleAction,
    createCadenceMembershipAction,
    listCadencesAction,
    createNoteAction,
    createCustomApiCallAction({
      baseUrl: () => SALESLOFT_API_BASE,
      auth: salesloftAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
