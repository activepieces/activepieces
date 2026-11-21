import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const addMemberToSegment = createAction({
  auth: mailchimpAuth,
  name: 'add_member_to_segment',
  classification: 'WRITE',
  displayName: 'Add Member to Static Segment',
  description: 'Add an existing audience member to a static segment or tag.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds an existing member (list_id + email) to a static segment or tag by its numeric segment_id (from List Segments or Resolve Segment). The member must already be in the audience; saved (condition-based) segments cannot be edited this way. Idempotent: adding a member who is already in the segment succeeds and changes nothing.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['segmentMemberAdded'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    segment_id: mailchimpCommon.mailChimpSegmentIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the audience member.',
      required: true,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const segmentId = mailchimpApi.requireText({ value: context.propsValue.segment_id, label: 'Segment or Tag' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email Address' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const member = await client.request<SegmentMember>({
      method: HttpMethod.POST,
      path: `/lists/${encodeURIComponent(listId)}/segments/${encodeURIComponent(segmentId)}/members`,
      body: { email_address: email },
      operation: 'add member to segment',
    });
    return {
      id: member.id,
      email_address: member.email_address,
      status: member.status,
      list_id: member.list_id ?? listId,
      segment_id: segmentId,
    };
  },
});

type SegmentMember = { id: string; email_address: string; status: string; list_id?: string };
