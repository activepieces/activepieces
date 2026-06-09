import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';

export const updateSubscriberInList = createAction({
  auth: mailchimpAuth,
  name: 'update_member_in_list',
  displayName: 'Update Member in an Audience (List)',
  description: 'Update a member in an existing Mailchimp audience (list)',
  audience: 'both',
  aiMetadata: { description: 'Updates the subscription status (subscribed, unsubscribed, cleaned, pending, transactional) of an existing member in an audience (list), identified by email. Use to change a known contact\'s status; the member must already exist, or the call fails. Idempotent: setting the same status repeatedly converges to that state.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the new contact',
      required: true,
    }),
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    status: Property.StaticDropdown<
      'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional'
    >({
      displayName: 'Status',
      required: true,
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Cleaned', value: 'cleaned' },
          { label: 'Pending', value: 'pending' },
          { label: 'Transactional', value: 'transactional' },
        ],
      },
    }),
  },
  async run(context) {
    const { list_id, email, status } = context.propsValue;
    const access_token = context.auth.access_token;
    const mailChimpServerPrefix =
      await mailchimpCommon.getMailChimpServerPrefix(access_token);
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });
    return await mailchimp.lists.updateListMember(
      list_id as string,
      email!,
      {
        status: status!,
      }
    );
  },
});
