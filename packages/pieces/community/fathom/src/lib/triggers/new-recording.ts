import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newRecording = createTrigger({
  auth: fathomAuth,
  name: 'new-recording',
  displayName: 'New Recording',
  description: 'Triggers when a new recording is completed in Fathom',
  props: {
    triggeredFor: Property.StaticMultiSelectDropdown({
      displayName: 'Triggered For',
      description: 'Select which recordings should trigger this webhook',
      required: true,
      options: {
        options: [
          {
            label: 'My Recordings',
            value: 'my_recordings',
          },
          {
            label: 'My Shared with Team Recordings',
            value: 'my_shared_with_team_recordings',
          },
          {
            label: 'Shared with Me External Recordings',
            value: 'shared_with_me_external_recordings',
          },
        ],
      },
    }),
    includeTranscript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include the transcript in the webhook payload',
      required: false,
      defaultValue: true,
    }),
    includeSummary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include the summary in the webhook payload',
      required: false,
      defaultValue: true,
    }),
    includeActionItems: Property.Checkbox({
      displayName: 'Include Action Items',
      description: 'Include action items in the webhook payload',
      required: false,
      defaultValue: true,
    }),
    includeCrmMatches: Property.Checkbox({
      displayName: 'Include CRM Matches',
      description: 'Include CRM matches in the webhook payload',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    recording_id: '123456789',
    title: 'Sample Meeting Recording',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T11:00:00Z',
    duration: 3600,
    transcript: 'This is a sample transcript...',
    summary: 'This is a sample summary...',
    action_items: [
      {
        text: 'Follow up on project status',
        assignee: 'John Doe',
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { auth, webhookUrl, propsValue, store } = context;

    // Create webhook using Fathom API
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/webhooks',
      {
        destination_url: webhookUrl,
        triggered_for: propsValue.triggeredFor,
        include_transcript: propsValue.includeTranscript ?? true,
        include_summary: propsValue.includeSummary ?? true,
        include_action_items: propsValue.includeActionItems ?? true,
        include_crm_matches: propsValue.includeCrmMatches ?? false,
      }
    );

    // Store webhook ID for later deletion
    await store.put('fathom_webhook_id', {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const { auth, store } = context;

    // Retrieve stored webhook ID
    const webhookData = await store.get<{ webhookId: string }>('fathom_webhook_id');

    if (webhookData?.webhookId) {
      // Delete the webhook using Fathom API
      await makeRequest(
        auth as string,
        HttpMethod.DELETE,
        `/webhooks/${webhookData.webhookId}`
      );

      // Clear stored data
      await store.put('fathom_webhook_id', null);
    }
  },
  async run(context) {
    const { payload } = context;
    return [payload.body];
  },
});