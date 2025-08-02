import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const partialFormSubmissionTrigger = createTrigger({
  displayName: 'New Partial Form Submission',
  name: 'partial_form_submission',
  description: 'Fires when a partial/in-progress submission is received',
  auth: paperformApiAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID to monitor',
      required: true,
    }),
  },
  sampleData: {
    partialSubmission: {
      id: 'partial_sub_123456789',
      form_slug_or_id: 'my-form',
      created_at: '2024-01-01T12:00:00Z',
      data: {
        name: 'John Doe',
        email: 'john@example.com'
        // Note: partial submissions may have incomplete data
      }
    }
  },
  async onEnable({ auth, propsValue, webhookUrl, store }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    // Create webhook for the form
    const webhookData = {
      target_url: webhookUrl,
      triggers: ['partial_submission.created'], // Assuming this is the trigger type for partial submissions
    };
    
    const response = await paperformCommon.makeRequest(
      paperformAuth,
      `/forms/${propsValue.formSlugOrId}/webhooks`,
      HttpMethod.POST,
      webhookData
    );
    
    // Store webhook ID for later deletion
    await store.put('partialWebhookId', response.body.id);
  },
  
  async onDisable({ auth, store }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    // Get webhook ID from store
    const webhookId = await store.get('partialWebhookId');
    
    if (webhookId) {
      // Delete the webhook
      await paperformCommon.makeRequest(
        paperformAuth,
        `/webhooks/${webhookId}`,
        HttpMethod.DELETE
      );
    }
  },
  
  async run({ payload }) {
    // Process the webhook payload
    const body = payload.body as any;
    
    return [{
      partialSubmission: body,
      formSlugOrId: body.form_slug_or_id,
      partialSubmissionId: body.id,
      createdAt: body.created_at,
      data: body.data,
    }];
  },
}); 