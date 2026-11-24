import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp } from '../common/props';
import { workableSchemas } from '../common/schemas';

export const getCandidate = createAction({
  auth: workableAuth,
  name: 'getCandidate',
  classification: 'READ',
  displayName: 'Get Candidate',
  description: "Gets a candidate's full profile.",
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Workable candidate by candidate ID, with contact details, stage, job, tags, skills, experience and education. Use before updating, moving or rating a known candidate. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.candidate,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
  },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const id = encodeId({ value: context.propsValue.id, label: 'Candidate ID' });
    const body = await client.request({ method: HttpMethod.GET, path: `/candidates/${id}` });
    return workableOps.unwrap({ body, key: 'candidate' });
  },
});
