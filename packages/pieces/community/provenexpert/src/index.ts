import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { provenExpertCommon } from './lib/common';
import { getRatingSummaryAction } from './lib/actions/get-rating-summary';
import { createSurveyInvitationUrlAction } from './lib/actions/create-survey-invitation-url';
import { sendSurveyInvitationEmailAction } from './lib/actions/send-survey-invitation-email';
import { listSurveysAction } from './lib/actions/list-surveys';
import { getProfileAction } from './lib/actions/get-profile';
import { provenExpertAuth } from './lib/common/auth';

export const provenexpert = createPiece({
  displayName: 'ProvenExpert',
  description:
    'Collect customer reviews, send survey invitations, and pull rating data from ProvenExpert.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/provenexpert.png',
  categories: [PieceCategory.MARKETING, PieceCategory.FORMS_AND_SURVEYS],
  auth: provenExpertAuth,
  authors: ['sanket-a11y'],
  actions: [
    getRatingSummaryAction,
    createSurveyInvitationUrlAction,
    sendSurveyInvitationEmailAction,
    listSurveysAction,
    getProfileAction,
    createCustomApiCallAction({
      baseUrl: () => provenExpertCommon.baseUrl,
      auth: provenExpertAuth,
      authMapping: async (auth) => {
        const credentials = auth;
        const encoded = Buffer.from(
          `${credentials.props.api_id}:${credentials.props.api_key}`
        ).toString('base64');
        return {
          Authorization: `Basic ${encoded}`,
        };
      },
    }),
  ],
  triggers: [],
});
