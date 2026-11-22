import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { addAnnotationAction } from './lib/actions/add-annotation';
import { createAnnotationAction } from './lib/actions/create-annotation';
import { deleteAnnotationAction } from './lib/actions/delete-annotation';
import { getGoalConversionsAction } from './lib/actions/get-goal-conversions';
import { getRecentVisitsAction } from './lib/actions/get-recent-visits';
import { getReferrersAction } from './lib/actions/get-referrers';
import { getTopPagesAction } from './lib/actions/get-top-pages';
import { getVisitsSummaryAction } from './lib/actions/get-visits-summary';
import { listAnnotationsAction } from './lib/actions/list-annotations';
import { listGoalsAction } from './lib/actions/list-goals';
import { listSitesAction } from './lib/actions/list-sites';
import { trackEventAction } from './lib/actions/track-event';
import { matomoApi } from './lib/api';
import { matomoAuth } from './lib/auth';
import { newVisitTrigger } from './lib/triggers/new-visit';

export const matomo = createPiece({
  displayName: 'Matomo',
  description: 'Open source alternative to Google Analytics',

  auth: matomoAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/matomo.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    addAnnotationAction,
    createAnnotationAction,
    listAnnotationsAction,
    deleteAnnotationAction,
    listSitesAction,
    getVisitsSummaryAction,
    getTopPagesAction,
    getReferrersAction,
    listGoalsAction,
    getGoalConversionsAction,
    getRecentVisitsAction,
    trackEventAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? matomoApi.normaliseDomain(auth.props.domain) : ''),
      auth: matomoAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.tokenAuth}`,
      }),
    }),
  ],
  triggers: [newVisitTrigger],
});
