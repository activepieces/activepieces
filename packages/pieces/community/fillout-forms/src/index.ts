import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { filloutFormsAuth } from './lib/common/auth';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSingleResponse } from './lib/actions/get-single-response';
import { findFormByTitle } from './lib/actions/find-form-by-title';
import { newFormResponse } from './lib/triggers/new-form-response';

export const filloutForms = createPiece({
  displayName: 'Fillout Forms',
  description: 'Create interactive forms with logic, advanced UI components, and integrations. Automate form response handling and data collection.',
  auth: filloutFormsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/form.png',
  authors: ['krikera'],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    getFormResponses, 
    getSingleResponse, 
    findFormByTitle,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.fillout.com/v1/api',
      auth: filloutFormsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newFormResponse],
});