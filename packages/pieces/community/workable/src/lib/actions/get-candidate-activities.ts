import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const getCandidateActivities = createAction({
  auth: workableAuth,
  name: 'get_candidate_activities',
  classification: 'READ',
  displayName: 'Get Candidate Activities',
  description: "Gets a candidate's timeline: comments, stage moves, ratings and more.",
  audience: 'both',
  aiMetadata: {
    description: "Get the activity timeline of one Workable candidate by candidate ID: comments, stage moves, ratings, disqualifications, each with member and time. Read-only.",
    idempotent: true,
  },
  outputSchema: workableSchemas.activities,
  props: { account_subdomain: accountSubdomainProp, id: candidateIdProp },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const id = encodeId({ value: context.propsValue.id, label: 'Candidate ID' });
    const body = await client.request({ method: HttpMethod.GET, path: `/candidates/${id}/activities` });
    const activities = workableValues.records(workableValues.rec(body)['activities']);
    return { activities, count: activities.length };
  },
});
