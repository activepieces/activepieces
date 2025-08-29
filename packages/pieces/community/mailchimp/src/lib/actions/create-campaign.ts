import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const createCampaign = createAction({
  auth: mailchimpAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new Mailchimp campaign with comprehensive options including RSS, A/B testing, and variate campaigns',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      description: 'The type of campaign to create',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Plaintext', value: 'plaintext' },
          { label: 'A/B Split (Deprecated)', value: 'absplit' },
          { label: 'RSS', value: 'rss' },
          { label: 'Variate (A/B Testing)', value: 'variate' },
        ],
      },
    }),

    list_id: mailchimpCommon.mailChimpListIdDropdown,
    
    subject_line: Property.ShortText({
      displayName: 'Subject Line',
      description: 'The subject line for the campaign',
      required: false,
    }),
    preview_text: Property.ShortText({
      displayName: 'Preview Text',
      description: 'The preview text for the campaign',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Campaign Title',
      description: 'The title of the campaign',
      required: false,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      description: 'The name that will appear in the "From" field',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To Email',
      description: 'The reply-to email address for the campaign',
      required: false,
    }),
    to_name: Property.ShortText({
      displayName: 'To Name',
      description: 'The campaign\'s custom "To" name (e.g., *|FNAME|*)',
      required: false,
      defaultValue: '*|FNAME|*',
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'If the campaign is listed in a folder, the id for that folder',
      required: false,
    }),

    use_conversation: Property.Checkbox({
      displayName: 'Use Conversation Feature',
      description: 'Use Mailchimp Conversation feature to manage out-of-office replies',
      required: false,
      defaultValue: false,
    }),
    authenticate: Property.Checkbox({
      displayName: 'Authenticate Campaign',
      description: 'Whether Mailchimp should authenticate the campaign',
      required: false,
      defaultValue: true,
    }),
    auto_footer: Property.Checkbox({
      displayName: 'Auto Footer',
      description: 'Automatically append Mailchimp\'s default footer to the campaign',
      required: false,
      defaultValue: false,
    }),
    inline_css: Property.Checkbox({
      displayName: 'Inline CSS',
      description: 'Automatically inline the CSS included with the campaign content',
      required: false,
      defaultValue: false,
    }),
    auto_tweet: Property.Checkbox({
      displayName: 'Auto Tweet',
      description: 'Automatically tweet a link to the campaign archive page when sent',
      required: false,
      defaultValue: false,
    }),
    fb_comments: Property.Checkbox({
      displayName: 'Facebook Comments',
      description: 'Allows Facebook comments on the campaign',
      required: false,
      defaultValue: true,
    }),
    timewarp: Property.Checkbox({
      displayName: 'Timewarp',
      description: 'Send this campaign using Timewarp',
      required: false,
      defaultValue: false,
    }),

    auto_fb_post: Property.Array({
      displayName: 'Facebook Page IDs',
      description: 'Array of Facebook page IDs to auto-post to',
      required: false,
    }),

    social_card_title: Property.ShortText({
      displayName: 'Social Card Title',
      description: 'The title for the social card (typically the subject line)',
      required: false,
    }),
    social_card_description: Property.LongText({
      displayName: 'Social Card Description',
      description: 'A short summary of the campaign to display on social networks',
      required: false,
    }),
    social_card_image_url: Property.ShortText({
      displayName: 'Social Card Image URL',
      description: 'The URL for the header image for the social card',
      required: false,
    }),

    track_opens: Property.Checkbox({
      displayName: 'Track Opens',
      description: 'Whether to track opens',
      required: false,
      defaultValue: true,
    }),
    track_html_clicks: Property.Checkbox({
      displayName: 'Track HTML Clicks',
      description: 'Whether to track clicks in the HTML version',
      required: false,
      defaultValue: true,
    }),
    track_text_clicks: Property.Checkbox({
      displayName: 'Track Text Clicks',
      description: 'Whether to track clicks in the plain-text version',
      required: false,
      defaultValue: true,
    }),
    ecomm360: Property.Checkbox({
      displayName: 'E-commerce Tracking',
      description: 'Whether to enable e-commerce tracking',
      required: false,
      defaultValue: false,
    }),
    google_analytics: Property.ShortText({
      displayName: 'Google Analytics Slug',
      description: 'Custom slug for Google Analytics tracking (max 50 bytes)',
      required: false,
    }),
    clicktale: Property.ShortText({
      displayName: 'ClickTale Slug',
      description: 'Custom slug for ClickTale tracking (max 50 bytes)',
      required: false,
    }),

    rss_feed_url: Property.ShortText({
      displayName: 'RSS Feed URL',
      description: 'The URL for the RSS feed (required for RSS campaigns)',
      required: false,
    }),
    rss_frequency: Property.StaticDropdown({
      displayName: 'RSS Frequency',
      description: 'The frequency of the RSS Campaign',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
        ],
      },
    }),
    rss_hour: Property.Number({
      displayName: 'RSS Send Hour',
      description: 'The hour to send the campaign in local time (0-23)',
      required: false,
    }),
    rss_constrain_images: Property.Checkbox({
      displayName: 'Constrain RSS Images',
      description: 'Whether to add CSS to images in the RSS feed to constrain their width',
      required: false,
      defaultValue: false,
    }),

    rss_sunday: Property.Checkbox({
      displayName: 'Send on Sunday',
      description: 'Send the daily RSS Campaign on Sundays',
      required: false,
      defaultValue: false,
    }),
    rss_monday: Property.Checkbox({
      displayName: 'Send on Monday',
      description: 'Send the daily RSS Campaign on Mondays',
      required: false,
      defaultValue: false,
    }),
    rss_tuesday: Property.Checkbox({
      displayName: 'Send on Tuesday',
      description: 'Send the daily RSS Campaign on Tuesdays',
      required: false,
      defaultValue: false,
    }),
    rss_wednesday: Property.Checkbox({
      displayName: 'Send on Wednesday',
      description: 'Send the daily RSS Campaign on Wednesdays',
      required: false,
      defaultValue: false,
    }),
    rss_thursday: Property.Checkbox({
      displayName: 'Send on Thursday',
      description: 'Send the daily RSS Campaign on Thursdays',
      required: false,
      defaultValue: false,
    }),
    rss_friday: Property.Checkbox({
      displayName: 'Send on Friday',
      description: 'Send the daily RSS Campaign on Fridays',
      required: false,
      defaultValue: false,
    }),
    rss_saturday: Property.Checkbox({
      displayName: 'Send on Saturday',
      description: 'Send the daily RSS Campaign on Saturdays',
      required: false,
      defaultValue: false,
    }),

    rss_weekly_send_day: Property.StaticDropdown({
      displayName: 'Weekly Send Day',
      description: 'The day of the week to send a weekly RSS Campaign',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Sunday', value: 'sunday' },
          { label: 'Monday', value: 'monday' },
          { label: 'Tuesday', value: 'tuesday' },
          { label: 'Wednesday', value: 'wednesday' },
          { label: 'Thursday', value: 'thursday' },
          { label: 'Friday', value: 'friday' },
          { label: 'Saturday', value: 'saturday' },
        ],
      },
    }),
    rss_monthly_send_date: Property.Number({
      displayName: 'Monthly Send Date',
      description: 'The day of the month to send (0-31, where 0 is the last day)',
      required: false,
    }),

    variate_wait_time: Property.Number({
      displayName: 'Variate Wait Time (minutes)',
      description: 'Minutes to wait before choosing the winning campaign (must be > 0 and in whole hours)',
      required: false,
    }),
    variate_test_size: Property.Number({
      displayName: 'Variate Test Size (%)',
      description: 'Percentage of recipients to send test combinations to (10-100)',
      required: false,
    }),
    variate_winner_criteria: Property.StaticDropdown({
      displayName: 'Variate Winner Criteria',
      description: 'How to determine the winning combination',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Opens', value: 'opens' },
          { label: 'Clicks', value: 'clicks' },
          { label: 'Manual', value: 'manual' },
          { label: 'Total Revenue', value: 'total_revenue' },
        ],
      },
    }),
    variate_subject_lines: Property.Array({
      displayName: 'Variate Subject Lines',
      description: 'Possible subject lines to test (if empty, settings.subject_line will be used)',
      required: false,
    }),
    variate_send_times: Property.Array({
      displayName: 'Variate Send Times',
      description: 'Possible send times to test (format: YYYY-MM-DD HH:MM:SS)',
      required: false,
    }),
    variate_from_names: Property.Array({
      displayName: 'Variate From Names',
      description: 'Possible from names to test',
      required: false,
    }),
    variate_reply_to_addresses: Property.Array({
      displayName: 'Variate Reply-To Addresses',
      description: 'Possible reply-to addresses to test (must match number of from_names)',
      required: false,
    }),

    ab_split_test: Property.StaticDropdown({
      displayName: 'A/B Split Test Type',
      description: 'The type of AB split to run (deprecated, use variate campaigns instead)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Subject', value: 'subject' },
          { label: 'From Name', value: 'from_name' },
          { label: 'Schedule', value: 'schedule' },
        ],
      },
    }),
    ab_pick_winner: Property.StaticDropdown({
      displayName: 'A/B Winner Selection',
      description: 'How to evaluate a winner for A/B split campaigns',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Opens', value: 'opens' },
          { label: 'Clicks', value: 'clicks' },
          { label: 'Manual', value: 'manual' },
        ],
      },
    }),
    ab_wait_units: Property.StaticDropdown({
      displayName: 'A/B Wait Units',
      description: 'Unit of time for measuring the winner',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' },
        ],
      },
    }),
    ab_wait_time: Property.Number({
      displayName: 'A/B Wait Time',
      description: 'Amount of time to wait before picking a winner',
      required: false,
    }),
    ab_split_size: Property.Number({
      displayName: 'A/B Split Size (%)',
      description: 'Size of the split groups (1-50, schedule splits are forced to 50/50)',
      required: false,
    }),

    ab_from_name_a: Property.ShortText({
      displayName: 'A/B From Name A',
      description: 'For campaigns split on From Name, the name for Group A',
      required: false,
    }),
    ab_from_name_b: Property.ShortText({
      displayName: 'A/B From Name B',
      description: 'For campaigns split on From Name, the name for Group B',
      required: false,
    }),
    ab_reply_email_a: Property.ShortText({
      displayName: 'A/B Reply Email A',
      description: 'For campaigns split on From Name, the reply-to address for Group A',
      required: false,
    }),
    ab_reply_email_b: Property.ShortText({
      displayName: 'A/B Reply Email B',
      description: 'For campaigns split on From Name, the reply-to address for Group B',
      required: false,
    }),
    ab_subject_a: Property.ShortText({
      displayName: 'A/B Subject A',
      description: 'For campaigns split on Subject Line, the subject line for Group A',
      required: false,
    }),
    ab_subject_b: Property.ShortText({
      displayName: 'A/B Subject B',
      description: 'For campaigns split on Subject Line, the subject line for Group B',
      required: false,
    }),
    ab_send_time_a: Property.ShortText({
      displayName: 'A/B Send Time A',
      description: 'The send time for Group A (format: YYYY-MM-DD HH:MM:SS)',
      required: false,
    }),
    ab_send_time_b: Property.ShortText({
      displayName: 'A/B Send Time B',
      description: 'The send time for Group B (format: YYYY-MM-DD HH:MM:SS)',
      required: false,
    }),

    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'How the campaign content is put together',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Template', value: 'template' },
          { label: 'Multichannel', value: 'multichannel' },
        ],
      },
      defaultValue: 'template',
    }),
    template_id: Property.Number({
      displayName: 'Template ID',
      description: 'The ID of the template to use',
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
      const campaignPayload: any = {
        type: context.propsValue.type,
        recipients: {
          list_id: context.propsValue.list_id!,
        },
      };

      const settings: any = {};
      if (context.propsValue.subject_line) settings.subject_line = context.propsValue.subject_line;
      if (context.propsValue.preview_text) settings.preview_text = context.propsValue.preview_text;
      if (context.propsValue.title) settings.title = context.propsValue.title;
      if (context.propsValue.from_name) settings.from_name = context.propsValue.from_name;
      if (context.propsValue.reply_to) settings.reply_to = context.propsValue.reply_to;
      if (context.propsValue.to_name) settings.to_name = context.propsValue.to_name;
      if (context.propsValue.folder_id) settings.folder_id = context.propsValue.folder_id;
      if (context.propsValue.use_conversation !== undefined) settings.use_conversation = context.propsValue.use_conversation;
      if (context.propsValue.authenticate !== undefined) settings.authenticate = context.propsValue.authenticate;
      if (context.propsValue.auto_footer !== undefined) settings.auto_footer = context.propsValue.auto_footer;
      if (context.propsValue.inline_css !== undefined) settings.inline_css = context.propsValue.inline_css;
      if (context.propsValue.auto_tweet !== undefined) settings.auto_tweet = context.propsValue.auto_tweet;
      if (context.propsValue.fb_comments !== undefined) settings.fb_comments = context.propsValue.fb_comments;
      if (context.propsValue.timewarp !== undefined) settings.timewarp = context.propsValue.timewarp;
      if (context.propsValue.template_id) settings.template_id = context.propsValue.template_id;

      if (Object.keys(settings).length > 0) {
        campaignPayload.settings = settings;
      }

      const tracking: any = {};
      if (context.propsValue.track_opens !== undefined) tracking.opens = context.propsValue.track_opens;
      if (context.propsValue.track_html_clicks !== undefined) tracking.html_clicks = context.propsValue.track_html_clicks;
      if (context.propsValue.track_text_clicks !== undefined) tracking.text_clicks = context.propsValue.track_text_clicks;
      if (context.propsValue.ecomm360 !== undefined) tracking.ecomm360 = context.propsValue.ecomm360;
      if (context.propsValue.google_analytics) tracking.google_analytics = context.propsValue.google_analytics;
      if (context.propsValue.clicktale) tracking.clicktale = context.propsValue.clicktale;

      if (Object.keys(tracking).length > 0) {
        campaignPayload.tracking = tracking;
      }

      const socialCard: any = {};
      if (context.propsValue.social_card_title) socialCard.title = context.propsValue.social_card_title;
      if (context.propsValue.social_card_description) socialCard.description = context.propsValue.social_card_description;
      if (context.propsValue.social_card_image_url) socialCard.image_url = context.propsValue.social_card_image_url;

      if (Object.keys(socialCard).length > 0) {
        campaignPayload.social_card = socialCard;
      }

      if (context.propsValue.auto_fb_post && context.propsValue.auto_fb_post.length > 0) {
        if (!campaignPayload.settings) campaignPayload.settings = {};
        campaignPayload.settings.auto_fb_post = context.propsValue.auto_fb_post;
      }

      if (context.propsValue.type === 'rss' && context.propsValue.rss_feed_url) {
        const rssOpts: any = {
          feed_url: context.propsValue.rss_feed_url,
          frequency: context.propsValue.rss_frequency || 'daily',
        };

        const schedule: any = {};
        if (context.propsValue.rss_hour !== undefined) schedule.hour = context.propsValue.rss_hour;
        if (context.propsValue.rss_constrain_images !== undefined) rssOpts.constrain_rss_img = context.propsValue.rss_constrain_images;

        const dailySend: any = {};
        if (context.propsValue.rss_sunday !== undefined) dailySend.sunday = context.propsValue.rss_sunday;
        if (context.propsValue.rss_monday !== undefined) dailySend.monday = context.propsValue.rss_monday;
        if (context.propsValue.rss_tuesday !== undefined) dailySend.tuesday = context.propsValue.rss_tuesday;
        if (context.propsValue.rss_wednesday !== undefined) dailySend.wednesday = context.propsValue.rss_wednesday;
        if (context.propsValue.rss_thursday !== undefined) dailySend.thursday = context.propsValue.rss_thursday;
        if (context.propsValue.rss_friday !== undefined) dailySend.friday = context.propsValue.rss_friday;
        if (context.propsValue.rss_saturday !== undefined) dailySend.saturday = context.propsValue.rss_saturday;

        if (Object.keys(dailySend).length > 0) {
          schedule.daily_send = dailySend;
        }

        if (context.propsValue.rss_weekly_send_day) {
          schedule.weekly_send_day = context.propsValue.rss_weekly_send_day;
        }
        if (context.propsValue.rss_monthly_send_date !== undefined) {
          schedule.monthly_send_date = context.propsValue.rss_monthly_send_date;
        }

        if (Object.keys(schedule).length > 0) {
          rssOpts.schedule = schedule;
        }

        campaignPayload.rss_opts = rssOpts;
      }

      if (context.propsValue.type === 'variate') {
        const variateSettings: any = {};
        
        if (context.propsValue.variate_wait_time) variateSettings.wait_time = context.propsValue.variate_wait_time;
        if (context.propsValue.variate_test_size) variateSettings.test_size = context.propsValue.variate_test_size;
        if (context.propsValue.variate_winner_criteria) variateSettings.winner_criteria = context.propsValue.variate_winner_criteria;
        if (context.propsValue.variate_subject_lines && context.propsValue.variate_subject_lines.length > 0) {
          variateSettings.subject_lines = context.propsValue.variate_subject_lines;
        }
        if (context.propsValue.variate_send_times && context.propsValue.variate_send_times.length > 0) {
          variateSettings.send_times = context.propsValue.variate_send_times;
        }
        if (context.propsValue.variate_from_names && context.propsValue.variate_from_names.length > 0) {
          variateSettings.from_names = context.propsValue.variate_from_names;
        }
        if (context.propsValue.variate_reply_to_addresses && context.propsValue.variate_reply_to_addresses.length > 0) {
          variateSettings.reply_to_addresses = context.propsValue.variate_reply_to_addresses;
        }

        if (Object.keys(variateSettings).length > 0) {
          campaignPayload.variate_settings = variateSettings;
        }
      }

      if (context.propsValue.type === 'absplit') {
        const abSplitOpts: any = {};
        
        if (context.propsValue.ab_split_test) abSplitOpts.split_test = context.propsValue.ab_split_test;
        if (context.propsValue.ab_pick_winner) abSplitOpts.pick_winner = context.propsValue.ab_pick_winner;
        if (context.propsValue.ab_wait_units) abSplitOpts.wait_units = context.propsValue.ab_wait_units;
        if (context.propsValue.ab_wait_time) abSplitOpts.wait_time = context.propsValue.ab_wait_time;
        if (context.propsValue.ab_split_size) abSplitOpts.split_size = context.propsValue.ab_split_size;
        if (context.propsValue.ab_from_name_a) abSplitOpts.from_name_a = context.propsValue.ab_from_name_a;
        if (context.propsValue.ab_from_name_b) abSplitOpts.from_name_b = context.propsValue.ab_from_name_b;
        if (context.propsValue.ab_reply_email_a) abSplitOpts.reply_email_a = context.propsValue.ab_reply_email_a;
        if (context.propsValue.ab_reply_email_b) abSplitOpts.reply_email_b = context.propsValue.ab_reply_email_b;
        if (context.propsValue.ab_subject_a) abSplitOpts.subject_a = context.propsValue.ab_subject_a;
        if (context.propsValue.ab_subject_b) abSplitOpts.subject_b = context.propsValue.ab_subject_b;
        if (context.propsValue.ab_send_time_a) abSplitOpts.send_time_a = context.propsValue.ab_send_time_a;
        if (context.propsValue.ab_send_time_b) abSplitOpts.send_time_b = context.propsValue.ab_send_time_b;

        if (Object.keys(abSplitOpts).length > 0) {
          campaignPayload.ab_split_opts = abSplitOpts;
        }
      }

      const campaign = await (mailchimp as any).campaigns.create(campaignPayload);

      return {
        success: true,
        campaign_id: campaign.id,
        web_id: campaign.web_id,
        type: campaign.type,
        status: campaign.status,
        title: campaign.settings?.title,
        subject_line: campaign.settings?.subject_line,
        from_name: campaign.settings?.from_name,
        reply_to: campaign.settings?.reply_to,
        create_time: campaign.create_time,
        archive_url: campaign.archive_url,
        long_archive_url: campaign.long_archive_url,
        recipients: {
          list_id: campaign.recipients?.list_id,
          list_name: campaign.recipients?.list_name,
          recipient_count: campaign.recipients?.recipient_count,
        },
        tracking: campaign.tracking,
        variate_settings: campaign.variate_settings,
        rss_opts: campaign.rss_opts,
        ab_split_opts: campaign.ab_split_opts,
        social_card: campaign.social_card,
      };
    } catch (e) {
      throw new Error(`Failed to create campaign: ${JSON.stringify(e)}`);
    }
  },
});
