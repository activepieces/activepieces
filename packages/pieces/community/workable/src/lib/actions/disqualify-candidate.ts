import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp, memberIdText } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

const MAX_NOTE = 256;

export const disqualifyCandidate = createAction({
  auth: workableAuth,
  name: 'disqualify_candidate',
  classification: 'WRITE',
  displayName: 'Disqualify Candidate',
  description: 'Disqualifies a candidate, with an optional reason and note.',
  audience: 'both',
  aiMetadata: {
    description:
      'Disqualify a Workable candidate on behalf of a hiring-team member. Optional reason ID (from List Disqualification Reasons), a note of up to 256 characters, and whether the candidate withdrew. Undo with Revert Disqualification. Running it again on a disqualified candidate keeps them disqualified.',
    idempotent: true,
  },
  outputSchema: workableSchemas.disqualified,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    member_id: memberIdText({ description: 'ID of the member disqualifying the candidate. Find it with Get Members.' }),
    disqualify_reason_id: Property.ShortText({
      displayName: 'Reason ID',
      description: 'Find it with List Disqualification Reasons.',
      required: false,
    }),
    disqualify_note: Property.LongText({ displayName: 'Note', description: 'Up to 256 characters.', required: false }),
    withdrew: Property.Checkbox({ displayName: 'Candidate Withdrew', required: false, defaultValue: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const memberId = v.optionalText(p.member_id);
    if (memberId === undefined) {
      throw new Error('Acting Member ID is required.');
    }
    const note = v.optionalText(p.disqualify_note);
    if (note !== undefined && note.length > MAX_NOTE) {
      throw new Error(`Note is ${note.length} characters; Workable allows at most ${MAX_NOTE}.`);
    }
    const body: Record<string, unknown> = { member_id: memberId };
    const reason = v.optionalText(p.disqualify_reason_id);
    if (reason !== undefined) {
      body['disqualify_reason_id'] = reason;
    }
    if (note !== undefined) {
      body['disqualify_note'] = note;
    }
    if (v.bool(p.withdrew) === true) {
      body['withdrew'] = true;
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    await client.request({ method: HttpMethod.POST, path: `/candidates/${id}/disqualify`, body });
    return { success: true, candidate_id: decodeURIComponent(id), disqualified: true };
  },
});
