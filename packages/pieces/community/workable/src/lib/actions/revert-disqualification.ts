import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp, memberIdText } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const revertDisqualification = createAction({
  auth: workableAuth,
  name: 'revert_disqualification',
  classification: 'WRITE',
  displayName: 'Revert Disqualification',
  description: 'Brings a disqualified candidate back into the pipeline.',
  audience: 'both',
  aiMetadata: {
    description:
      'Undo the disqualification of a Workable candidate on behalf of a hiring-team member (member ID from Get Members). The candidate returns to the stage they were in.',
    idempotent: true,
  },
  outputSchema: workableSchemas.disqualified,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    member_id: memberIdText({ description: 'ID of the member reverting the disqualification. Find it with Get Members.' }),
  },
  async run(context) {
    const p = context.propsValue;
    const memberId = workableValues.optionalText(p.member_id);
    if (memberId === undefined) {
      throw new Error('Acting Member ID is required.');
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    await client.request({ method: HttpMethod.POST, path: `/candidates/${id}/revert`, body: { member_id: memberId } });
    return { success: true, candidate_id: decodeURIComponent(id), disqualified: false };
  },
});
