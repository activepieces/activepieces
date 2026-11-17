import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp, memberIdText } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const addComment = createAction({
  auth: workableAuth,
  name: 'add_comment',
  classification: 'WRITE',
  displayName: 'Add Comment',
  description: "Adds a comment to a candidate's timeline.",
  audience: 'both',
  aiMetadata: {
    description:
      "Add a comment to a Workable candidate's timeline on behalf of a hiring-team member (member ID from Get Members). Visibility limits which roles can see it; empty means everyone on the hiring team. Not idempotent: each call adds another comment.",
    idempotent: false,
  },
  outputSchema: workableSchemas.commented,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    member_id: memberIdText({ description: 'ID of the member writing the comment. Find it with Get Members.' }),
    body: Property.LongText({ displayName: 'Comment', required: true }),
    policy: Property.StaticMultiSelectDropdown({
      displayName: 'Visible To',
      description: 'Roles that can see the comment. Empty: everyone on the hiring team.',
      required: false,
      options: {
        options: [
          { label: 'Simple members', value: 'simple' },
          { label: 'Reviewers', value: 'reviewer' },
        ],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const text = v.optionalText(p.body);
    if (text === undefined) {
      throw new Error('Comment is required.');
    }
    const memberId = v.optionalText(p.member_id);
    if (memberId === undefined) {
      throw new Error('Acting Member ID is required.');
    }
    const policy = v.stringList({ value: p.policy, label: 'Visible To' }) ?? [];
    const comment: Record<string, unknown> = { body: text };
    if (policy.length > 0) {
      comment['policy'] = policy;
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    await client.request({ method: HttpMethod.POST, path: `/candidates/${id}/comments`, body: { member_id: memberId, comment } });
    return { success: true, candidate_id: decodeURIComponent(id) };
  },
});
