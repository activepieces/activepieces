import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newResponse } from './lib/triggers/new-form-response';
import { newOrUpdatedResponse } from './lib/triggers/new-or-updated-response';
import { googleFormsAuth, getAccessToken, GoogleFormsAuthValue } from './lib/common/common';
import { getFormAction } from './lib/actions/get-form';
import { getResponseAction } from './lib/actions/get-response';
import { listResponsesAction } from './lib/actions/list-responses';
import { createFormAction } from './lib/actions/create-form';
import { addQuestionAction } from './lib/actions/add-question';

export { googleFormsAuth, getAccessToken, GoogleFormsAuthValue } from './lib/common/common';

export const googleForms = createPiece({
  displayName: 'Google Forms',
  description: 'Receive form responses from Google Forms',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-forms.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","Startouf"],
  auth: googleFormsAuth,
  actions: [
    createFormAction,
    addQuestionAction,
    getFormAction,
    getResponseAction,
    listResponsesAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://forms.googleapis.com/v1',
      auth: googleFormsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(auth as GoogleFormsAuthValue)}`,
      }),
    }),
  ],
  triggers: [newResponse, newOrUpdatedResponse],
});
