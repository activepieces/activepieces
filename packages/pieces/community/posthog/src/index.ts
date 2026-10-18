import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { posthogCreateEvent } from './lib/actions/create-event';
import { posthogCreateProject } from './lib/actions/create-project';
import { posthogGetFeatureFlags } from './lib/actions/get-feature-flags';
import { posthogListPersons } from './lib/actions/list-persons';
import { createAnnotation } from './lib/actions/ai/create-annotation';
import { createFeatureFlag } from './lib/actions/ai/create-feature-flag';
import { deleteAnnotation } from './lib/actions/ai/delete-annotation';
import { deleteFeatureFlag } from './lib/actions/ai/delete-feature-flag';
import { deletePerson } from './lib/actions/ai/delete-person';
import { evaluateFeatureFlags } from './lib/actions/ai/evaluate-feature-flags';
import { getFeatureFlag } from './lib/actions/ai/get-feature-flag';
import { getPerson } from './lib/actions/ai/get-person';
import { listCohorts } from './lib/actions/ai/list-cohorts';
import { listDashboards } from './lib/actions/ai/list-dashboards';
import { listEventDefinitions } from './lib/actions/ai/list-event-definitions';
import { listInsights } from './lib/actions/ai/list-insights';
import { runHogqlQuery } from './lib/actions/ai/run-hogql-query';
import { updateFeatureFlag } from './lib/actions/ai/update-feature-flag';
import { updatePersonProperties } from './lib/actions/ai/update-person-properties';
import { captureEventsBatch } from './lib/actions/ai/capture-events-batch';
import { deletePersonProperty } from './lib/actions/ai/delete-person-property';
import { listProjects } from './lib/actions/ai/list-projects';
import { getCurrentUser } from './lib/actions/ai/get-current-user';
import { getCohort } from './lib/actions/ai/get-cohort';
import { createCohort } from './lib/actions/ai/create-cohort';
import { addPersonsToStaticCohort } from './lib/actions/ai/add-persons-to-static-cohort';
import { getAnnotation } from './lib/actions/ai/get-annotation';
import { updateAnnotation } from './lib/actions/ai/update-annotation';
import { getInsight } from './lib/actions/ai/get-insight';
import { createInsight } from './lib/actions/ai/create-insight';
import { getDashboard } from './lib/actions/ai/get-dashboard';
import { createDashboard } from './lib/actions/ai/create-dashboard';
import { listActions } from './lib/actions/ai/list-actions';
import { getAction } from './lib/actions/ai/get-action';
import { listSurveys } from './lib/actions/ai/list-surveys';
import { getSurvey } from './lib/actions/ai/get-survey';
import { getSurveyStats } from './lib/actions/ai/get-survey-stats';
import { listExperiments } from './lib/actions/ai/list-experiments';
import { getExperimentResults } from './lib/actions/ai/get-experiment-results';
import { listGroups } from './lib/actions/ai/list-groups';
import { listSessionRecordings } from './lib/actions/ai/list-session-recordings';
import { posthogAuth } from './lib/auth';
import { PostHogAuthValue } from './lib/common/client';
import { posthogCustomApiCall } from './lib/actions/custom-api-call';
import { posthogNewEvent } from './lib/triggers/new-event';

export { posthogAuth };
export type PostHogAuth = PostHogAuthValue;

export const posthog = createPiece({
  displayName: 'PostHog',
  description: 'Open-source product analytics',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/posthog.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: posthogAuth,
  actions: [
    posthogCreateEvent,
    posthogCreateProject,
    posthogGetFeatureFlags,
    posthogListPersons,
    runHogqlQuery,
    getPerson,
    updatePersonProperties,
    deletePerson,
    getFeatureFlag,
    createFeatureFlag,
    updateFeatureFlag,
    deleteFeatureFlag,
    evaluateFeatureFlags,
    listCohorts,
    listInsights,
    listDashboards,
    listEventDefinitions,
    createAnnotation,
    deleteAnnotation,
    captureEventsBatch,
    deletePersonProperty,
    listProjects,
    getCurrentUser,
    getCohort,
    createCohort,
    addPersonsToStaticCohort,
    getAnnotation,
    updateAnnotation,
    getInsight,
    createInsight,
    getDashboard,
    createDashboard,
    listActions,
    getAction,
    listSurveys,
    getSurvey,
    getSurveyStats,
    listExperiments,
    getExperimentResults,
    listGroups,
    listSessionRecordings,
    posthogCustomApiCall,
  ],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'Tosh94', 'OdaiAhmed99'],
  triggers: [posthogNewEvent],
});
