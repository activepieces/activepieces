import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { opnformNewSubmission } from './lib/triggers/new-submission';
import { API_URL_DEFAULT, opnformCommon } from './lib/common';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { opnformAuth } from './lib/auth';

export const opnform = createPiece({
  displayName: 'Opnform',
  description:
    'Create beautiful online forms and surveys with unlimited fields and submissions',

  auth: opnformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/opnform.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ['JhumanJ', 'chiragchhatrala'],
  actions: [
    createCustomApiCallAction({
      auth: opnformAuth,
      baseUrl: (auth) => {
        return opnformCommon.getBaseUrl(auth);
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.props.apiKey}`,
        };
      },
    }),
  ],
  triggers: [opnformNewSubmission],
});
