import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartleadRequest } from '../common/client';
import { smartleadAuth } from '../auth';

export const updateCampaignSettingsAction = createAction({
  auth: smartleadAuth,
  name: 'update_campaign_settings',
  displayName: 'Update Campaign Settings',
  description:
    'Update campaign settings including tracking, sending limits, and stop conditions.',
  props: {
    campaign_id: Property.Number({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to update',
      required: true,
    }),
    track_open: Property.Checkbox({
      displayName: 'Track Opens',
      description: 'Enable email open tracking',
      required: false,
    }),
    track_click: Property.Checkbox({
      displayName: 'Track Clicks',
      description: 'Enable link click tracking',
      required: false,
    }),
    sending_limit: Property.Number({
      displayName: 'Daily Sending Limit',
      description: 'Maximum leads to contact per day',
      required: false,
    }),
    min_time_btwn_emails: Property.Number({
      displayName: 'Minimum Time Between Emails (minutes)',
      description: 'Minimum minutes between consecutive emails',
      required: false,
    }),
    stop_lead_settings: Property.StaticDropdown({
      displayName: 'Stop Lead Condition',
      description: 'When to stop emailing a lead',
      required: false,
      options: {
        options: [
          { label: 'Reply to an email', value: 'REPLY_TO_AN_EMAIL' },
          { label: 'Opened email', value: 'OPENED_EMAIL' },
          { label: 'Clicked link', value: 'CLICKED_LINK' },
        ],
      },
    }),
    enable_ai_esp_matching: Property.Checkbox({
      displayName: 'Enable AI ESP Matching',
      description:
        'Use AI to intelligently pair leads with optimal email accounts',
      required: false,
    }),
    send_as_plain_text: Property.Checkbox({
      displayName: 'Send as Plain Text',
      description:
        'Send emails as plain text for better deliverability with technical audiences',
      required: false,
    }),
    follow_up_percentage: Property.Number({
      displayName: 'Follow Up Percentage',
      description:
        'Percentage of leads to follow up with (0-100)',
      required: false,
    }),
  },
  async run(context) {
    const {
      campaign_id,
      track_open,
      track_click,
      sending_limit,
      min_time_btwn_emails,
      stop_lead_settings,
      enable_ai_esp_matching,
      send_as_plain_text,
      follow_up_percentage,
    } = context.propsValue;
    const apiKey = context.auth;

    const body: Record<string, unknown> = {};

    if (track_open !== undefined || track_click !== undefined) {
      body['track_settings'] = {
        ...(track_open !== undefined && { track_open }),
        ...(track_click !== undefined && { track_click }),
      };
    }

    if (sending_limit !== undefined) body['sending_limit'] = sending_limit;
    if (min_time_btwn_emails !== undefined)
      body['min_time_btwn_emails'] = min_time_btwn_emails;
    if (stop_lead_settings !== undefined)
      body['stop_lead_settings'] = stop_lead_settings;
    if (enable_ai_esp_matching !== undefined)
      body['enable_ai_esp_matching'] = enable_ai_esp_matching;
    if (send_as_plain_text !== undefined)
      body['send_as_plain_text'] = send_as_plain_text;
    if (follow_up_percentage !== undefined) {
      if (follow_up_percentage < 0 || follow_up_percentage > 100) {
        throw new Error(
          `follow_up_percentage must be between 0 and 100. Got ${follow_up_percentage}.`
        );
      }
      body['follow_up_percentage'] = follow_up_percentage;
    }

    if (Object.keys(body).length === 0) {
      throw new Error(
        'At least one setting must be provided to update.'
      );
    }

    return await smartleadRequest({
      endpoint: `campaigns/${campaign_id}/settings`,
      method: HttpMethod.POST,
      apiKey,
      body,
    });
  },
});
