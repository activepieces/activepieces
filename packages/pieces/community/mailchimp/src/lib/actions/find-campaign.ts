import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const findCampaign = createAction({
  auth: mailchimpAuth,
  name: 'find_campaign',
  displayName: 'Find Campaign',
  description: 'Get information about a specific Mailchimp campaign',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The unique ID of the campaign to find',
      required: true,
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description: 'Comma-separated list of fields to return (optional)',
      required: false,
    }),
    exclude_fields: Property.ShortText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated list of fields to exclude (optional)',
      required: false,
    }),
    include_resend_shortcut_eligibility: Property.Checkbox({
      displayName: 'Include Resend Shortcut Eligibility',
      description: 'Include resend shortcut eligibility information',
      required: false,
      defaultValue: false,
    }),
    include_resend_shortcut_usage: Property.Checkbox({
      displayName: 'Include Resend Shortcut Usage',
      description: 'Include resend shortcut usage information',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    try {
      const mailchimp = require('@mailchimp/mailchimp_marketing');
      mailchimp.setConfig({
        accessToken: accessToken,
        server: server,
      });

      const queryParams: any = {};
      
      if (context.propsValue.fields) {
        queryParams.fields = context.propsValue.fields;
      }
      
      if (context.propsValue.exclude_fields) {
        queryParams.exclude_fields = context.propsValue.exclude_fields;
      }
      
      if (context.propsValue.include_resend_shortcut_eligibility) {
        queryParams.include_resend_shortcut_eligibility = context.propsValue.include_resend_shortcut_eligibility;
      }
      
      if (context.propsValue.include_resend_shortcut_usage) {
        queryParams.include_resend_shortcut_usage = context.propsValue.include_resend_shortcut_usage;
      }

      const campaign = await mailchimp.campaigns.get(context.propsValue.campaign_id!, queryParams);

      return {
        success: true,
        campaign: {
          id: campaign.id,
          web_id: campaign.web_id,
          type: campaign.type,
          create_time: campaign.create_time,
          archive_url: campaign.archive_url,
          long_archive_url: campaign.long_archive_url,
          status: campaign.status,
          emails_sent: campaign.emails_sent,
          send_time: campaign.send_time,
          content_type: campaign.content_type,
          needs_block_refresh: campaign.needs_block_refresh,
          resendable: campaign.resendable,
          recipients: campaign.recipients,
          settings: campaign.settings,
          variate_settings: campaign.variate_settings,
          tracking: campaign.tracking,
          rss_opts: campaign.rss_opts,
          ab_split_opts: campaign.ab_split_opts,
          social_card: campaign.social_card,
          report_summary: campaign.report_summary,
          delivery_status: campaign.delivery_status,
          resend_shortcut_eligibility: campaign.resend_shortcut_eligibility,
          resend_shortcut_usage: campaign.resend_shortcut_usage,
          _links: campaign._links || [],
        },
        _links: campaign._links || [],
      };
    } catch (error: any) {
      console.error('Error finding campaign:', error);
      throw new Error(`Failed to find campaign: ${error.message || JSON.stringify(error)}`);
    }
  },
});
