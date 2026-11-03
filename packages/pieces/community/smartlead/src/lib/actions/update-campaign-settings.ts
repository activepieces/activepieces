import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations, STOP_LEAD_OPTIONS } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';
import { smartleadProps } from '../common/props';

export const updateCampaignSettingsAction = createAction({
  auth: smartleadAuth,
  name: 'update_campaign_settings',
  classification: 'WRITE',
  displayName: 'Update Campaign Settings',
  description:
    'Update campaign settings including tracking, stop conditions, and deliverability options. Settings left empty are not changed.',
  audience: 'human',
  outputSchema: smartleadOutputSchemas.updateCampaignSettings,
  props: {
    campaign_id: Property.Number({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to update',
      required: true,
    }),
    track_open: smartleadProps.triStateDropdown({
      displayName: 'Track Opens',
      description: 'Email open tracking.',
    }),
    track_click: smartleadProps.triStateDropdown({
      displayName: 'Track Clicks',
      description: 'Link click tracking.',
    }),
    stop_lead_settings: Property.StaticDropdown({
      displayName: 'Stop Lead Condition',
      description: 'When to stop emailing a lead',
      required: false,
      options: { options: STOP_LEAD_OPTIONS },
    }),
    unsubscribe_text: Property.LongText({
      displayName: 'Unsubscribe Text',
      description: 'Custom unsubscribe text added to campaign emails',
      required: false,
    }),
    enable_ai_esp_matching: smartleadProps.triStateDropdown({
      displayName: 'Enable AI ESP Matching',
      description: 'Use AI to pair leads with the best-matching email accounts.',
    }),
    send_as_plain_text: smartleadProps.triStateDropdown({
      displayName: 'Send as Plain Text',
      description: 'Send emails as plain text.',
    }),
    follow_up_percentage: Property.Number({
      displayName: 'Follow Up Percentage',
      description: 'Percentage of leads to follow up with (0-100)',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return smartleadOperations.updateCampaignSettings({
      apiKey: context.auth.secret_text,
      campaignId: p.campaign_id,
      settings: {
        trackOpens: smartleadOperations.parseTriStateBoolean({ value: p.track_open, label: 'Track Opens' }),
        trackClicks: smartleadOperations.parseTriStateBoolean({ value: p.track_click, label: 'Track Clicks' }),
        stopLeadSettings: p.stop_lead_settings,
        unsubscribeText: p.unsubscribe_text,
        enableAiEspMatching: smartleadOperations.parseTriStateBoolean({ value: p.enable_ai_esp_matching, label: 'Enable AI ESP Matching' }),
        sendAsPlainText: smartleadOperations.parseTriStateBoolean({ value: p.send_as_plain_text, label: 'Send as Plain Text' }),
        followUpPercentage: p.follow_up_percentage,
      },
    });
  },
});
