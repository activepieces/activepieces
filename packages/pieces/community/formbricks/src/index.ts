import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { formBricksAuth } from './lib/common/auth';
import { normalizeAppUrl } from './lib/common/client';
import { createContactAttributeKeyAction } from './lib/actions/create-contact-attribute-key';
import { createResponseAction } from './lib/actions/create-response';
import { deleteContactAction } from './lib/actions/delete-contact';
import { deleteResponseAction } from './lib/actions/delete-response';
import { findContactAction } from './lib/actions/find-contact';
import { getContactSurveyLinkAction } from './lib/actions/get-contact-survey-link';
import { getResponseAction } from './lib/actions/get-response';
import { getSurveyAction } from './lib/actions/get-survey';
import { listActionClassesAction } from './lib/actions/list-action-classes';
import { listContactAttributeKeysAction } from './lib/actions/list-contact-attribute-keys';
import { listResponsesAction } from './lib/actions/list-responses';
import { listSurveysAction } from './lib/actions/list-surveys';
import { updateResponseAction } from './lib/actions/update-response';
import { updateSurveyStatusAction } from './lib/actions/update-survey-status';
import { upsertContactAction } from './lib/actions/upsert-contact';
import { createContactAttributeKeyAiAction } from './lib/actions/ai/create-contact-attribute-key';
import { createResponseAiAction } from './lib/actions/ai/create-response';
import { findContactAiAction } from './lib/actions/ai/find-contact';
import { getContactSurveyLinkAiAction } from './lib/actions/ai/get-contact-survey-link';
import { getSurveyAiAction } from './lib/actions/ai/get-survey';
import { listResponsesAiAction } from './lib/actions/ai/list-responses';
import { listSurveysAiAction } from './lib/actions/ai/list-surveys';
import { updateSurveyStatusAiAction } from './lib/actions/ai/update-survey-status';
import { upsertContactAiAction } from './lib/actions/ai/upsert-contact';
import { triggers } from './lib/triggers';

export const formbricks = createPiece({
  displayName: 'Formbricks',
  description: 'Open source Survey Platform',
  auth: formBricksAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/formbricks.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'abuaboud', 'OdaiAhmed99'],
  actions: [
    listSurveysAction,
    getSurveyAction,
    updateSurveyStatusAction,
    listResponsesAction,
    getResponseAction,
    createResponseAction,
    updateResponseAction,
    deleteResponseAction,
    upsertContactAction,
    findContactAction,
    deleteContactAction,
    listContactAttributeKeysAction,
    createContactAttributeKeyAction,
    listActionClassesAction,
    getContactSurveyLinkAction,
    listSurveysAiAction,
    getSurveyAiAction,
    updateSurveyStatusAiAction,
    listResponsesAiAction,
    createResponseAiAction,
    upsertContactAiAction,
    findContactAiAction,
    createContactAttributeKeyAiAction,
    getContactSurveyLinkAiAction,
    createCustomApiCallAction({
      auth: formBricksAuth,
      authMapping: async (auth) => ({
        'x-api-key': auth.props.apiKey,
      }),
      baseUrl: (auth) => (auth ? `${normalizeAppUrl(auth.props.appUrl)}/api/v1` : ''),
    }),
  ],
  triggers,
});
