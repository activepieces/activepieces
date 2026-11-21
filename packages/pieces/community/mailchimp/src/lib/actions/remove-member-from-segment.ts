import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi, MailchimpApiError } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const removeMemberFromSegment = createAction({
  auth: mailchimpAuth,
  name: 'remove_member_from_segment',
  classification: 'WRITE',
  displayName: 'Remove Member from Static Segment',
  description: 'Remove an audience member from a static segment or tag.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes a member (list_id + email) from a static segment or tag by numeric segment_id (from List Segments or Resolve Segment). The member stays in the audience. Not idempotent: Mailchimp returns 400 "Member does not belong to the static segment" when the member is no longer in it, so a repeat call fails.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['segmentMemberRemoved'],
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
    try {
      await client.request<unknown>({
        method: HttpMethod.DELETE,
        path: `/lists/${encodeURIComponent(listId)}/segments/${encodeURIComponent(segmentId)}/members/${mailchimpCommon.getMD5EmailHash(email)}`,
        operation: 'remove member from segment',
      });
    } catch (error) {
      if (error instanceof MailchimpApiError && error.status === 400 && /does not belong/i.test(error.message)) {
        throw new MailchimpApiError({
          message: `${email} is not in segment ${segmentId}, so there was nothing to remove (Mailchimp HTTP 400).`,
          status: 400,
          responseBody: error.responseBody,
        });
      }
      throw error;
    }
    return { success: true, list_id: listId, segment_id: segmentId, email };
  },
});
