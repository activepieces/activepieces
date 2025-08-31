import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';
import crypto from 'crypto';

export const addMemberToList = createAction({
  auth: mailchimpAuth,
  name: 'add_member_to_list',
  displayName: 'Add or Update Subscriber',
  description: 'Add a new subscriber to an audience or update existing subscriber',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address for the subscriber',
      required: true,
    }),
    status_if_new: Property.StaticDropdown({
      displayName: 'Status if New',
      description: 'Status for new subscribers',
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
    email_type: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'Type of email this member wants to receive',
      required: false,
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Current status of subscriber (for updates)',
      required: false,
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
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the subscriber',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the subscriber',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Subscriber language (e.g., "en", "es", "fr")',
      required: false,
    }),
    vip: Property.Checkbox({
      displayName: 'VIP',
      description: 'VIP status for subscriber',
      required: false,
      defaultValue: false,
    }),
    skip_merge_validation: Property.Checkbox({
      displayName: 'Skip Merge Validation',
      description: 'Accept member data without merge field values even if required',
      required: false,
      defaultValue: false,
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
      const subscriberHash = crypto.createHash('md5').update(context.propsValue.email_address.toLowerCase()).digest('hex');
      
      const memberData: any = {
        email_address: context.propsValue.email_address,
        status_if_new: context.propsValue.status_if_new,
      };

      if (context.propsValue.email_type) {
        memberData.email_type = context.propsValue.email_type;
      }
      
      if (context.propsValue.status) {
        memberData.status = context.propsValue.status;
      }
      
      if (context.propsValue.first_name || context.propsValue.last_name) {
        memberData.merge_fields = {};
        if (context.propsValue.first_name) {
          memberData.merge_fields.FNAME = context.propsValue.first_name;
        }
        if (context.propsValue.last_name) {
          memberData.merge_fields.LNAME = context.propsValue.last_name;
        }
      }
      
      if (context.propsValue.language) {
        memberData.language = context.propsValue.language;
      }
      
      if (context.propsValue.vip !== undefined) {
        memberData.vip = context.propsValue.vip;
      }

      const queryParams: any = {};
      if (context.propsValue.skip_merge_validation) {
        queryParams.skip_merge_validation = true;
      }

      const member = await client.lists.setListMember(
        context.propsValue.list_id!,
        subscriberHash,
        memberData,
        queryParams
      );

      return {
        success: true,
        id: member.id,
        email_address: member.email_address,
        unique_email_id: member.unique_email_id,
        contact_id: member.contact_id,
        full_name: member.full_name,
        web_id: member.web_id,
        email_type: member.email_type,
        status: member.status,
        merge_fields: member.merge_fields,
        interests: member.interests,
        stats: member.stats,
        ip_signup: member.ip_signup,
        timestamp_signup: member.timestamp_signup,
        ip_opt: member.ip_opt,
        timestamp_opt: member.timestamp_opt,
        member_rating: member.member_rating,
        last_changed: member.last_changed,
        language: member.language,
        vip: member.vip,
        email_client: member.email_client,
        location: member.location,
        marketing_permissions: member.marketing_permissions,
        source: member.source,
        tags_count: member.tags_count,
        tags: member.tags,
        list_id: member.list_id,
        _links: member._links,
      };
    } catch (error: any) {
      throw new Error(`Failed to add or update subscriber: ${error.message || JSON.stringify(error)}`);
    }
  },
});
