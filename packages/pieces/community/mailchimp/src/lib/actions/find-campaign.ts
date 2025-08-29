import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findCampaign = createAction({
  auth: mailchimpAuth,
  name: 'find_campaign',
  displayName: 'Find Campaign',
  description: 'Finds an existing campaign by ID or search criteria with comprehensive campaign details',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'How to search for the campaign',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'By Campaign ID', value: 'id' },
          { label: 'By Campaign Title', value: 'title' },
          { label: 'By Subject Line', value: 'subject' },
        ],
      },
    }),
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The unique ID of the campaign to find (required if search_type is "id")',
      required: false,
    }),
    search_query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The title or subject to search for (required if search_type is "title" or "subject")',
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Include Fields',
      description: 'A comma-separated list of fields to return. Reference parameters of sub-objects with dot notation (e.g., "settings.title", "recipients.list_name")',
      required: false,
    }),
    exclude_fields: Property.Array({
      displayName: 'Exclude Fields',
      description: 'A comma-separated list of fields to exclude. Reference parameters of sub-objects with dot notation',
      required: false,
    }),
    include_resend_shortcut_eligibility: Property.Checkbox({
      displayName: 'Include Resend Shortcut Eligibility',
      description: 'Return the resend_shortcut_eligibility field in the response, which tells you if the campaign is eligible for the various Campaign Resend Shortcuts offered',
      required: false,
      defaultValue: false,
    }),
    include_resend_shortcut_usage: Property.Checkbox({
      displayName: 'Include Resend Shortcut Usage',
      description: 'Return the resend_shortcut_usage field in the response. This includes information about campaigns related by a shortcut',
      required: false,
      defaultValue: false,
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
      if (context.propsValue.search_type === 'id' && context.propsValue.campaign_id) {
        const options: any = {};
        
        if (context.propsValue.fields && context.propsValue.fields.length > 0) {
          options.fields = context.propsValue.fields.join(',');
        }
        
        if (context.propsValue.exclude_fields && context.propsValue.exclude_fields.length > 0) {
          options.exclude_fields = context.propsValue.exclude_fields.join(',');
        }

        if (context.propsValue.include_resend_shortcut_eligibility) {
          options.include_resend_shortcut_eligibility = true;
        }

        if (context.propsValue.include_resend_shortcut_usage) {
          options.include_resend_shortcut_usage = true;
        }

        const campaign = await (mailchimp as any).campaigns.get(context.propsValue.campaign_id, options);

        return {
          success: true,
          found: true,
          campaign: {
            id: campaign.id,
            web_id: campaign.web_id,
            parent_campaign_id: campaign.parent_campaign_id,
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
            _links: campaign._links,
          },
        };
      } else if (['title', 'subject'].includes(context.propsValue.search_type!) && context.propsValue.search_query) {
        const searchQuery = context.propsValue.search_query;
        const campaigns = await (mailchimp as any).campaigns.list({
          fields: ['campaigns.id', 'campaigns.settings.title', 'campaigns.settings.subject_line', 'campaigns.status', 'campaigns.type', 'campaigns.create_time', 'campaigns.emails_sent'],
          count: 100,
        });

        const matchingCampaigns = campaigns.campaigns.filter((campaign: any) => {
          if (context.propsValue.search_type === 'title') {
            return campaign.settings?.title?.toLowerCase().includes(searchQuery.toLowerCase());
          } else {
            return campaign.settings?.subject_line?.toLowerCase().includes(searchQuery.toLowerCase());
          }
        });

        if (matchingCampaigns.length === 0) {
          return {
            success: true,
            found: false,
            message: `No campaigns found matching ${context.propsValue.search_type}: "${searchQuery}"`,
            campaigns: [],
          };
        }

        const detailedCampaigns = await Promise.all(
          matchingCampaigns.map(async (campaign: any) => {
            try {
              const detailedCampaign = await (mailchimp as any).campaigns.get(campaign.id, {
                fields: ['id', 'web_id', 'type', 'status', 'create_time', 'emails_sent', 'send_time', 'content_type', 'recipients.list_name', 'settings.title', 'settings.subject_line', 'settings.from_name'],
              });
              
              return {
                id: detailedCampaign.id,
                web_id: detailedCampaign.web_id,
                type: detailedCampaign.type,
                status: detailedCampaign.status,
                create_time: detailedCampaign.create_time,
                emails_sent: detailedCampaign.emails_sent,
                send_time: detailedCampaign.send_time,
                content_type: detailedCampaign.content_type,
                recipients: {
                  list_name: detailedCampaign.recipients?.list_name,
                },
                settings: {
                  title: detailedCampaign.settings?.title,
                  subject_line: detailedCampaign.settings?.subject_line,
                  from_name: detailedCampaign.settings?.from_name,
                },
              };
            } catch (error) {
              return {
                id: campaign.id,
                error: `Failed to get detailed info: ${error}`,
                basic_info: campaign,
              };
            }
          })
        );

        return {
          success: true,
          found: true,
          message: `Found ${matchingCampaigns.length} campaign(s) matching ${context.propsValue.search_type}: "${searchQuery}"`,
          campaigns: detailedCampaigns,
        };
      } else {
        throw new Error('Invalid search configuration. Please provide either campaign_id for ID search or search_query for title/subject search.');
      }
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: true,
          found: false,
          message: 'Campaign not found',
          error: error.detail || 'The requested campaign could not be found',
        };
      }
      
      throw new Error(`Failed to find campaign: ${error.message || JSON.stringify(error)}`);
    }
  },
});
