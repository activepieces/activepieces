import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const deleteMemberPermanently = createAction({
  auth: mailchimpAuth,
  name: 'delete_member_permanently',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Member Permanently',
  description: 'Permanently delete a member and their data from an audience. This cannot be undone and the address cannot be re-imported later.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently erases one member (list_id + email) and all their data from the audience, for privacy or GDPR requests. It cannot be undone, and Mailchimp blocks re-importing the address afterwards (the person must re-subscribe themselves). To stop emailing someone but keep the record, use Archive Subscriber or set status to unsubscribed instead. Not idempotent: a second call fails because the member is gone.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['memberDeleted'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the audience member.',
      required: true,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email Address' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    await client.request<unknown>({
      method: HttpMethod.POST,
      path: `${mailchimpApi.memberPath({ listId, email })}/actions/delete-permanent`,
      operation: 'delete member permanently',
    });
    return { success: true, list_id: listId, email };
  },
});
