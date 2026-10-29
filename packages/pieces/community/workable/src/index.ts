import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createAction, createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addCandidateTags } from './lib/actions/add-candidate-tags';
import { addComment } from './lib/actions/add-comment';
import { createCandidateAi } from './lib/actions/ai/create-candidate-ai';
import { moveCandidateAi } from './lib/actions/ai/move-candidate-ai';
import { copyCandidateToJob } from './lib/actions/copy-candidate-to-job';
import { createCandidate } from './lib/actions/create-candidate';
import { disqualifyCandidate } from './lib/actions/disqualify-candidate';
import { getCandidate } from './lib/actions/get-candidate';
import { getCandidateActivities } from './lib/actions/get-candidate-activities';
import { getJob } from './lib/actions/get-job';
import { getMembers } from './lib/actions/get-members';
import { getStages } from './lib/actions/get-stages';
import { listAccounts } from './lib/actions/list-accounts';
import { listCandidates } from './lib/actions/list-candidates';
import { listDisqualificationReasons } from './lib/actions/list-disqualification-reasons';
import { listJobQuestions } from './lib/actions/list-job-questions';
import { listJobs } from './lib/actions/list-jobs';
import { listRecruiters } from './lib/actions/list-recruiters';
import { moveCandidate } from './lib/actions/move-candidate';
import { rateCandidate } from './lib/actions/rate-candidate';
import { revertDisqualification } from './lib/actions/revert-disqualification';
import { updateCandidate } from './lib/actions/update-candidate';
import { workableAuth } from './lib/auth';
import { baseUrlFor, isSameApiUrl, resolveSubdomain, ROOT_URL, tokenOf } from './lib/common/client';
import { accountSubdomainProp } from './lib/common/props';
import { workableValues } from './lib/common/values';
import { candidateStageChanged } from './lib/triggers/candidate-stage-changed';
import { newCandidate } from './lib/triggers/new-candidate';

const baseCustomApiCall = createCustomApiCallAction({
  baseUrl: () => ROOT_URL,
  auth: workableAuth,
  description: 'Make a custom API call to your Workable account (https://{subdomain}.workable.com/spi/v3).',
  extraProps: { account_subdomain: accountSubdomainProp },
  authMapping: async (auth, propsValue) => {
    const subdomain = await resolveSubdomain({ token: tokenOf(auth), subdomain: propsValue['account_subdomain'] });
    const url = workableValues.rec(propsValue['url'])['url'];
    if (typeof url !== 'string' || !isSameApiUrl({ subdomain, candidate: url })) {
      throw new Error(`Custom API Call only sends your token to ${baseUrlFor(subdomain)}. Use a path such as /jobs or a full URL on that host.`);
    }
    return { Authorization: `Bearer ${tokenOf(auth)}`, Accept: 'application/json' };
  },
});

const runCustomApiCall: typeof baseCustomApiCall.run = async (context) => {
  const values: Record<string, unknown> = context.propsValue;
  const subdomain = await resolveSubdomain({ token: tokenOf(context.auth), subdomain: values['account_subdomain'] });
  const urlProps = workableValues.rec(context.propsValue['url']);
  const raw = typeof urlProps['url'] === 'string' ? urlProps['url'].trim() : '';
  const absolute = /^https?:\/\//i.test(raw) ? raw : `${baseUrlFor(subdomain)}/${raw.replace(/^\/+/, '')}`;
  return baseCustomApiCall.run({
    ...context,
    propsValue: Object.assign({}, context.propsValue, { account_subdomain: subdomain, url: { ...urlProps, url: absolute } }),
  });
};

export const workableCustomApiCall = createAction({
  ...baseCustomApiCall,
  auth: workableAuth,
  audience: 'human',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Send a raw request to any Workable SPI v3 endpoint (relative path such as "jobs" or "candidates/{id}") on the selected account. The method can be DELETE. Returns the raw response.',
    idempotent: false,
  },
  run: runCustomApiCall,
  test: runCustomApiCall,
});

export const workable = createPiece({
  displayName: 'Workable',
  auth: workableAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/workable.png',
  categories: [PieceCategory.HUMAN_RESOURCES],
  authors: ['Cloudieunnie', 'OdaiAhmed99'],
  actions: [
    getCandidate,
    getMembers,
    getJob,
    getStages,
    moveCandidate,
    moveCandidateAi,
    rateCandidate,
    listCandidates,
    listJobs,
    createCandidate,
    createCandidateAi,
    updateCandidate,
    addComment,
    disqualifyCandidate,
    revertDisqualification,
    addCandidateTags,
    listDisqualificationReasons,
    listRecruiters,
    listJobQuestions,
    getCandidateActivities,
    copyCandidateToJob,
    listAccounts,
    workableCustomApiCall,
  ],
  triggers: [newCandidate, candidateStageChanged],
});
