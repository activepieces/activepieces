import { createPiece } from '@activepieces/pieces-framework';
import { filloutFormsAuth } from './lib/common/auth';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSingleResponse } from './lib/actions/get-single-response';
import { findFormByTitle } from './lib/actions/find-form-by-title';




export const filloutForms = createPiece({
  displayName: 'Fillout-forms',
  auth: filloutFormsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fillout-forms.png',
  authors: ['Sanket6652'],
  actions: [getFormResponses, getSingleResponse, findFormByTitle],
  triggers: [],
});
