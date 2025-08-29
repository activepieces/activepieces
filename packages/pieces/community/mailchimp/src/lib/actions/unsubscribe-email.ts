import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const unsubscribeEmail = createAction({
  auth: mailchimpAuth,
  name: 'unsubscribe_email',
  displayName: 'Unsubscribe Email',
  description: 'Unsubscribe an email address from a Mailchimp audience with comprehensive options for goodbye emails, notifications, and status management',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to unsubscribe',
      required: true,
    }),
    send_goodbye: Property.Checkbox({
      displayName: 'Send Goodbye Email',
      description: 'Whether to send a goodbye email to the subscriber when they unsubscribe',
      required: false,
      defaultValue: true,
    }),
    send_notify: Property.Checkbox({
      displayName: 'Send Notification',
      description: 'Whether to send a notification email to the list owner about the unsubscribe',
      required: false,
      defaultValue: false,
    }),
    unsubscribe_reason: Property.StaticDropdown({
      displayName: 'Unsubscribe Reason',
      description: 'The reason for the unsubscribe (optional, helps with analytics)',
      required: false,
      options: {
        options: [
          { label: 'No reason specified', value: '' },
          { label: 'Too many emails', value: 'too_many_emails' },
          { label: 'Content not relevant', value: 'content_not_relevant' },
          { label: 'Never signed up', value: 'never_signed_up' },
          { label: 'Spam concerns', value: 'spam_concerns' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    custom_reason: Property.ShortText({
      displayName: 'Custom Reason',
      description: 'Custom reason for unsubscribe (used when "Other" is selected)',
      required: false,
    }),
  },
  async run(context) {
    const access_token = context.auth.access_token;
    const mailChimpServerPrefix = await mailchimpCommon.getMailChimpServerPrefix(access_token);
    
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    try {
      const email = context.propsValue.email!;
      const listId = context.propsValue.list_id!;
      const sendGoodbye = context.propsValue.send_goodbye ?? true;
      const sendNotify = context.propsValue.send_notify ?? false;
      const unsubscribeReason = context.propsValue.unsubscribe_reason || '';
      const customReason = context.propsValue.custom_reason;
      
      const subscriberHash = mailchimpCommon.getMD5EmailHash(email);
      
      const updateData: any = {
        status: 'unsubscribed',
        send_goodbye: sendGoodbye,
        send_notify: sendNotify,
      };
      
      if (unsubscribeReason && unsubscribeReason !== '') {
        updateData.unsubscribe_reason = unsubscribeReason;
        if (unsubscribeReason === 'other' && customReason) {
          updateData.unsubscribe_reason = customReason;
        }
      }

      const updatedSubscriber = await (mailchimp as any).lists.updateListMember(
        listId,
        subscriberHash,
        updateData
      );

      const unsubscribeDetails = {
        email: email,
        list_id: listId,
        status: updatedSubscriber.status,
        unsubscribe_time: updatedSubscriber.last_changed,
        send_goodbye: sendGoodbye,
        send_notify: sendNotify,
        unsubscribe_reason: updateData.unsubscribe_reason || 'No reason specified',
      };

      const response = {
        success: true,
        message: `Email ${email} has been successfully unsubscribed from the audience`,
        unsubscribe_details: unsubscribeDetails,
        subscriber_info: {
          id: updatedSubscriber.id,
          email_address: updatedSubscriber.email_address,
          status: updatedSubscriber.status,
          list_id: updatedSubscriber.list_id,
          last_changed: updatedSubscriber.last_changed,
          member_rating: updatedSubscriber.member_rating,
          vip: updatedSubscriber.vip,
          email_type: updatedSubscriber.email_type,
          language: updatedSubscriber.language,
        },
        action_summary: {
          action: 'unsubscribe',
          timestamp: new Date().toISOString(),
          audience: listId,
          email: email,
          goodbye_email_sent: sendGoodbye,
          notification_sent: sendNotify,
          reason_provided: unsubscribeReason !== '' || customReason !== '',
        },
        next_steps: [
          'The subscriber has been marked as unsubscribed',
          sendGoodbye ? 'A goodbye email has been sent to the subscriber' : 'No goodbye email was sent',
          sendNotify ? 'A notification has been sent to the list owner' : 'No notification was sent to the list owner',
          'The subscriber can re-subscribe in the future if they choose to do so',
          'Consider reviewing your email frequency and content to reduce future unsubscribes',
        ],
      };

      return response;
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          error: 'Subscriber not found',
          message: `The email "${context.propsValue.email}" could not be found in the specified audience`,
          detail: error.detail || 'The requested resource could not be found',
          suggestions: [
            'Verify the email address is spelled correctly',
            'Check that the email exists in the specified audience',
            'Ensure the email has not already been unsubscribed or deleted',
            'Verify the audience ID is correct',
          ],
        };
      }
      
      if (error.status === 400) {
        return {
          success: false,
          error: 'Invalid unsubscribe request',
          message: 'The unsubscribe request was invalid. This could be due to malformed data or invalid parameters.',
          detail: error.detail || 'Bad request',
          suggestions: [
            'Verify the email address format is correct',
            'Check that the audience ID is valid',
            'Ensure all required parameters are provided',
            'Validate the unsubscribe reason if provided',
          ],
        };
      }
      
      if (error.status === 403) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to unsubscribe subscribers from this audience. Check your API key permissions.',
          detail: error.detail || 'Forbidden',
          suggestions: [
            'Verify your API key has the necessary permissions',
            'Check that you have access to the specified audience',
            'Ensure your account is active and in good standing',
            'Confirm you have subscriber management permissions enabled',
          ],
        };
      }
      
      if (error.status === 422) {
        return {
          success: false,
          error: 'Unprocessable entity',
          message: 'The unsubscribe request could not be processed. This might be due to invalid subscriber status or audience configuration.',
          detail: error.detail || 'Unprocessable entity',
          suggestions: [
            'Check if the subscriber is already unsubscribed',
            'Verify the audience is active and not archived',
            'Ensure the subscriber status allows for unsubscribing',
            'Check audience settings for any restrictions',
          ],
        };
      }
      
      throw new Error(`Failed to unsubscribe email: ${error.message || JSON.stringify(error)}`);
    }
  },
});
