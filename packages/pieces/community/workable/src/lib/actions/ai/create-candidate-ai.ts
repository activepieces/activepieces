import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../../auth';
import { workableOps } from '../../common/operations';
import { accountSubdomainProp, candidateFieldProps, candidateInputFrom } from '../../common/props';
import { workableSchemas } from '../../common/schemas';

export const createCandidateAi = createAction({
  auth: workableAuth,
  name: 'create_candidate_ai',
  classification: 'WRITE',
  displayName: 'Create Candidate (by IDs)',
  description: 'Adds a candidate to a job given by its shortcode, or to the talent pool.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a Workable candidate. Give a job shortcode (from List Jobs) to add them to that job, optionally with a stage slug (from Get Stages); leave the shortcode empty to add them to the talent pool. First name, last name and email are required. Sourced is on by default so Workable sends no email. If the email already exists on that job Workable refuses it; then find the candidate with List Candidates instead of retrying.',
    idempotent: false,
  },
  outputSchema: workableSchemas.createdCandidate,
  props: {
    account_subdomain: accountSubdomainProp,
    job_shortcode: Property.ShortText({
      displayName: 'Job Shortcode',
      description: 'Shortcode of the job. Empty adds the candidate to the talent pool.',
      required: false,
    }),
    stage: Property.ShortText({
      displayName: 'Stage Slug',
      description: 'Stage slug from Get Stages, for example "applied". Empty uses the first stage. Ignored for the talent pool.',
      required: false,
    }),
    ...candidateFieldProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.createCandidate({
      client,
      jobShortcode: p.job_shortcode,
      stage: p.job_shortcode ? p.stage : undefined,
      sourced: p.sourced,
      input: candidateInputFrom(p),
    });
  },
});
