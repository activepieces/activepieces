import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const unsubscribeEmail = createAction({
  auth: mailchimpAuth,
  name: 'unsubscribe_email',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Email',
  description: 'Unsubscribe an email address from an audience',
  audience: 'both',
  aiMetadata: { description: 'Sets an email address to unsubscribed status within an audience (list) via a batch upsert; with "update existing" on, it changes an existing member, otherwise it can add the address as unsubscribed. Use to opt a contact out of a specific audience. Idempotent: repeating converges to the same unsubscribed state.', idempotent: true },
  propertyGroups: [
    {
      key: 'subscriber',
      display: 'section',
      label: 'Subscriber',
      icon: 'user',
      props: ['list_id', 'email_address'],
    },
    {
      key: 'options',
      display: 'section',
      label: 'Options',
      icon: 'sliders',
      props: ['update_existing'],
    },
  ],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'The address to unsubscribe.',
      placeholder: 'jane@example.com',
      required: true,
    }),
    update_existing: Property.Checkbox({
      displayName: 'Update Existing',
      description: "Off leaves an existing subscriber's status unchanged.",
      required: false,
      defaultValue: true,
    }),
    skip_merge_validation: Property.Checkbox({
      displayName: 'Skip Merge Validation',
      description: 'Save the subscriber even if required merge fields are empty.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    skip_duplicate_check: Property.Checkbox({
      displayName: 'Skip Duplicate Check',
      description: "Skip Mailchimp's duplicate-address check.",
      required: false,
      defaultValue: false,
      advanced: true,
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
