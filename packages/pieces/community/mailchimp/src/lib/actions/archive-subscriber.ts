import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const archiveSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'archive_subscriber',
  displayName: 'Archive Subscriber',
  description: 'Archive a list member from a Mailchimp audience. This removes them from the active list but preserves their data. To permanently delete, use the delete-permanent action.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to archive',
      required: true,
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
      const subscriberHash = mailchimpCommon.getMD5EmailHash(context.propsValue.email);
      
      await (mailchimp as any).lists.deleteListMember(
        context.propsValue.list_id,
        subscriberHash
      );

      return {
        success: true,
        message: `Subscriber with email "${context.propsValue.email}" has been successfully archived from the list`,
        archived_subscriber: {
          email: context.propsValue.email,
          list_id: context.propsValue.list_id,
          subscriber_hash: subscriberHash,
          action: 'archived',
          timestamp: new Date().toISOString(),
        },
        note: 'The subscriber has been removed from the active list but their data is preserved. To permanently delete, use the delete-permanent action.',
      };
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          error: 'Subscriber not found',
          message: `The subscriber with email "${context.propsValue.email}" could not be found in the specified list. Make sure the email address is correct and the subscriber exists in the list.`,
          detail: error.detail || 'The requested resource could not be found',
          suggestions: [
            'Verify the email address is spelled correctly',
            'Check that the subscriber exists in the specified list',
            'Ensure the list ID is correct',
            'Confirm the subscriber has not already been archived or deleted',
          ],
        };
      }
      
      if (error.status === 400) {
        return {
          success: false,
          error: 'Invalid request',
          message: 'The request to archive the subscriber was invalid. This could be due to malformed data or invalid parameters.',
          detail: error.detail || 'Bad request',
          suggestions: [
            'Verify the list ID is valid',
            'Check that the email address format is correct',
            'Ensure all required parameters are provided',
          ],
        };
      }
      
      if (error.status === 403) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to archive subscribers from this list. Check your API key permissions.',
          detail: error.detail || 'Forbidden',
          suggestions: [
            'Verify your API key has the necessary permissions',
            'Check that you have access to the specified list',
            'Ensure your account is active and in good standing',
          ],
        };
      }
      
      throw new Error(`Failed to archive subscriber: ${error.message || JSON.stringify(error)}`);
    }
  },
});
