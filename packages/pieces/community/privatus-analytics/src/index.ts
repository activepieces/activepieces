import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { privatusAnalyticsAuth } from './lib/auth';
import { PRIVATUS_BASE_URL } from './lib/common/client';
import { listSitesAction } from './lib/actions/list-sites';
import { getStatsAction } from './lib/actions/get-stats';
import { getTimeseriesAction } from './lib/actions/get-timeseries';
import { getTopValuesAction } from './lib/actions/get-top-values';
import { getLiveVisitorsAction } from './lib/actions/get-live-visitors';
import { listGoalsAction } from './lib/actions/list-goals';
import { newGoalConversionTrigger } from './lib/triggers/new-goal-conversion';
import { trafficSpikeTrigger } from './lib/triggers/traffic-spike';

export const privatusAnalytics = createPiece({
  displayName: 'Privatus Analytics',
  description:
    'Cookieless website analytics: see visitors, top pages, referrers, live visitors and goal conversions without a cookie pop-up.',
  auth: privatusAnalyticsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://privatusanalytics.com/icon.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.MARKETING],
  authors: ['ja-andrews'],
  actions: [
    getStatsAction,
    getTimeseriesAction,
    getTopValuesAction,
    getLiveVisitorsAction,
    listGoalsAction,
    listSitesAction,
    createCustomApiCallAction({
      auth: privatusAnalyticsAuth,
      baseUrl: () => PRIVATUS_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newGoalConversionTrigger, trafficSpikeTrigger],
});
