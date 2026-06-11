import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { produktlyAuth } from './lib/common/auth';
import { PRODUKTLY_BASE_URL } from './lib/common/client';
import { listChangelogs } from './lib/actions/list-changelogs';
import { listChangelogPosts } from './lib/actions/list-changelog-posts';
import { createChangelogPost } from './lib/actions/create-changelog-post';
import { updateChangelogPost } from './lib/actions/update-changelog-post';
import { listFeedbackWidgets } from './lib/actions/list-feedback-widgets';
import { listFeedbackResponses } from './lib/actions/list-feedback-responses';
import { listRoadmaps } from './lib/actions/list-roadmaps';
import { getRoadmap } from './lib/actions/get-roadmap';
import { listNpsWidgets } from './lib/actions/list-nps-widgets';
import { getNpsScore } from './lib/actions/get-nps-score';
import { listNpsResponses } from './lib/actions/list-nps-responses';
import { listTags } from './lib/actions/list-tags';
import { getCompanyStats } from './lib/actions/get-company-stats';
import { getWidgetStats } from './lib/actions/get-widget-stats';
import { newChangelogPost } from './lib/triggers/new-changelog-post';
import { newFeedbackResponse } from './lib/triggers/new-feedback-response';
import { newNpsResponse } from './lib/triggers/new-nps-response';
import { newTag } from './lib/triggers/new-tag';

export { produktlyAuth } from './lib/common/auth';

export const produktly = createPiece({
  displayName: 'Produktly',
  description: 'Onboarding, in-app announcements, feedback collection and NPS for SaaS products.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/produktly.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.MARKETING],
  auth: produktlyAuth,
  authors: [],
  actions: [
    listChangelogs,
    listChangelogPosts,
    createChangelogPost,
    updateChangelogPost,
    listFeedbackWidgets,
    listFeedbackResponses,
    listRoadmaps,
    getRoadmap,
    listNpsWidgets,
    getNpsScore,
    listNpsResponses,
    listTags,
    getCompanyStats,
    getWidgetStats,
    createCustomApiCallAction({
      baseUrl: () => PRODUKTLY_BASE_URL,
      auth: produktlyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newChangelogPost, newFeedbackResponse, newNpsResponse, newTag],
});
