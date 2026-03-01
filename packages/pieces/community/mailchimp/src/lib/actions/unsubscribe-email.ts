import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const unsubscribeEmail = createAction({
  auth: mailchimpAuth,
  name: 'unsubscribe_email',
  displayName: 'Unsubscribe Email',
  description: 'Unsubscribe an email address from an audience',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to unsubscribe',
      required: true,
    }),
    skip_merge_validation: Property.Checkbox({
      displayName: 'Skip Merge Validation',
      description: 'Accept member data without merge field values even if required',
      required: false,
      defaultValue: false,
    }),
    skip_duplicate_check: Property.Checkbox({
      displayName: 'Skip Duplicate Check',
      description: 'Ignore duplicates in the request',
      required: false,
      defaultValue: false,
    }),
    update_existing: Property.Checkbox({
      displayName: 'Update Existing',
      description: 'Change existing members subscription status',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
    
    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      const batchData = {
        members: [
          {
            email_address: context.propsValue.email_address,
            status: 'unsubscribed',
          },
        ],
        update_existing: context.propsValue.update_existing,
      };

      const queryParams: any = {};
      if (context.propsValue.skip_merge_validation) {
        queryParams.skip_merge_validation = true;
      }
      if (context.propsValue.skip_duplicate_check) {
        queryParams.skip_duplicate_check = true;
      }

      const result = await client.lists.batchListMembers(
        context.propsValue.list_id!,
        batchData,
        queryParams
      );

      return {
        success: true,
        message: `Email ${context.propsValue.email_address} has been unsubscribed`,
        new_members: result.new_members,
        updated_members: result.updated_members,
        errors: result.errors,
        total_created: result.total_created,
        total_updated: result.total_updated,
        error_count: result.error_count,
        _links: result._links,
      };
    } catch (error: any) {
      throw new Error(`Failed to unsubscribe email: ${error.message || JSON.stringify(error)}`);
    }
  },
});
