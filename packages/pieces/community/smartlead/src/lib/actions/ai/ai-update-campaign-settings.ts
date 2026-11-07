import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiUpdateCampaignSettingsAction = createAction({
  auth: smartleadAuth,
  name: 'ai_update_campaign_settings',
  classification: 'WRITE',
  displayName: 'Update Campaign Settings',
  description: 'Change tracking, stop condition and sending settings of a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates settings of a SmartLead campaign by numeric campaign_id. Only the fields you pass change; omitted fields stay as they are. track_opens, track_clicks, enable_ai_esp_matching and send_as_plain_text take "on" or "off"; omit them to leave them unchanged. stop_lead_settings is one of REPLY_TO_AN_EMAIL, OPEN_AN_EMAIL, CLICK_ON_A_LINK. follow_up_percentage is 0-100. At least one setting is required. Idempotent.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.updateCampaignSettings,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    track_opens: Property.ShortText({ displayName: 'Track Opens', description: '"on" or "off". Omit to keep the current value.', required: false }),
    track_clicks: Property.ShortText({ displayName: 'Track Clicks', description: '"on" or "off". Omit to keep the current value.', required: false }),
    stop_lead_settings: Property.ShortText({ displayName: 'Stop Lead Condition', description: 'REPLY_TO_AN_EMAIL, OPEN_AN_EMAIL or CLICK_ON_A_LINK.', required: false }),
    unsubscribe_text: Property.LongText({ displayName: 'Unsubscribe Text', required: false }),
    enable_ai_esp_matching: Property.ShortText({ displayName: 'Enable AI ESP Matching', description: '"on" or "off". Omit to keep the current value.', required: false }),
    send_as_plain_text: Property.ShortText({ displayName: 'Send as Plain Text', description: '"on" or "off". Omit to keep the current value.', required: false }),
    follow_up_percentage: Property.Number({ displayName: 'Follow Up Percentage', description: '0-100.', required: false }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.updateCampaignSettings({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaign_id,
      settings: {
        trackOpens: smartleadOperations.parseOnOff({ value: propsValue.track_opens, label: 'track_opens' }),
        trackClicks: smartleadOperations.parseOnOff({ value: propsValue.track_clicks, label: 'track_clicks' }),
        stopLeadSettings: propsValue.stop_lead_settings,
        unsubscribeText: propsValue.unsubscribe_text,
        enableAiEspMatching: smartleadOperations.parseOnOff({ value: propsValue.enable_ai_esp_matching, label: 'enable_ai_esp_matching' }),
        sendAsPlainText: smartleadOperations.parseOnOff({ value: propsValue.send_as_plain_text, label: 'send_as_plain_text' }),
        followUpPercentage: propsValue.follow_up_percentage,
      },
    });
  },
});
