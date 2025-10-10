import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { formStackAuth } from './lib/common/auth';

import { createSubmission } from './lib/actions/create-submission';
import { findFormByNameOrId } from './lib/actions/find-form-by-name-or-id';
import { getSubmissionDetails } from './lib/actions/get-submission-details';
import { findSubmissionByFieldValue } from './lib/actions/find-submission-by-field-value';

import { newSubmission } from './lib/triggers/new-submission';
import { newForm } from './lib/triggers/new-form';
import { BASE_URL } from './lib/common/client';

export const formstack = createPiece({
  displayName: 'Formstack',
  auth: formStackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/formstack.png',
  authors: ['Sanket6652', 'onyedikachi-david'],
  actions: [
    createSubmission,
    findFormByNameOrId,
    getSubmissionDetails,
    findSubmissionByFieldValue,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: formStackAuth,
      authMapping: async (auth) => {
        const authValue = auth as OAuth2PropertyValue;

        return {
          Authorization: `Bearer ${authValue.access_token}`,
        };
      },
    }),
  ],
  triggers: [newSubmission, newForm],
});
