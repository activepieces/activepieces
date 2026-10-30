import { createAction } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateFieldProps, candidateInputFrom, jobDropdown, stageDropdown } from '../common/props';
import { workableSchemas } from '../common/schemas';

export const createCandidate = createAction({
  auth: workableAuth,
  name: 'create_candidate',
  classification: 'WRITE',
  displayName: 'Create Candidate',
  description: 'Adds a candidate to a job, or to the talent pool when no job is selected.',
  audience: 'human',
  aiMetadata: {
    description:
      'Create a Workable candidate in a job and stage picked from dropdowns, or in the talent pool when no job is picked. Sourced by default, so no email is sent. A second run with the same email on the same job fails with a duplicate error instead of creating a copy.',
    idempotent: false,
  },
  outputSchema: workableSchemas.createdCandidate,
  props: {
    account_subdomain: accountSubdomainProp,
    job: jobDropdown({ displayName: 'Job', description: 'Job to add the candidate to. Empty adds them to the talent pool.', required: false }),
    stage: stageDropdown({ required: false, description: 'Stage to add the candidate in. Empty uses the first stage.' }),
    ...candidateFieldProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.createCandidate({
      client,
      jobShortcode: p.job,
      stage: p.job ? p.stage : undefined,
      sourced: p.sourced,
      input: candidateInputFrom(p),
    });
  },
});
