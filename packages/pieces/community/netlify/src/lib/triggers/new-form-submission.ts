import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../common/auth';
import { NetlifyClient } from '../common/client';
import { siteIdProperty } from '../common/utils';

export const newFormSubmissionTrigger = createTrigger({
  auth: netlifyAuth,
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  description: 'Triggers when a form is submitted on your Netlify site',
  props: {
    siteId: siteIdProperty,
    formName: Property.ShortText({
      displayName: 'Form Name',
      description: 'Filter by specific form name (leave empty for all forms)',
      required: false
    })
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = new NetlifyClient(context.auth);
    
    try {
      // Create webhook for form submission events
      const webhookData = {
        url: context.webhookUrl,
        event: 'submission_created',
        disabled: false
      };

      const response = await client.createWebhook(context.propsValue.siteId, webhookData);
      
      // Store webhook details for cleanup
      await context.store?.put('webhook_details', {
        webhookId: response.id,
        siteId: context.propsValue.siteId,
        webhookUrl: context.webhookUrl,
        formName: context.propsValue.formName
      });

      console.log('Webhook created for new form submission events:', response);
    } catch (error) {
      console.error('Failed to create webhook for new form submission events:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new NetlifyClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.deleteWebhook(webhookDetails.webhookId);
        console.log('Webhook deleted for new form submission events');
      }
    } catch (error) {
      console.error('Failed to delete webhook for new form submission events:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    const formNameFilter = context.propsValue.formName;
    
    // Validate that this is a form submission event
    if (!payload || !payload.data) {
      return [];
    }

    // Filter by form name if specified
    if (formNameFilter && payload.form_name !== formNameFilter) {
      return [];
    }

    return [
      {
        id: payload.id,
        formId: payload.form_id,
        formName: payload.form_name,
        siteUrl: payload.site_url,
        submissionId: payload.number,
        data: payload.data,
        createdAt: payload.created_at,
        email: payload.email,
        name: payload.name,
        firstName: payload.first_name,
        lastName: payload.last_name,
        company: payload.company,
        summary: payload.summary,
        body: payload.body,
        rawPayload: payload
      }
    ];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'challenge'
  },
  sampleData: {
    id: 'submission_123456789',
    formId: 'form_123456789',
    formName: 'contact',
    siteUrl: 'https://mysite.netlify.app',
    submissionId: 1,
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'Hello, I would like to get in touch about your services.',
      phone: '+1234567890'
    },
    createdAt: '2024-01-01T12:00:00Z',
    email: 'john.doe@example.com',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corp',
    summary: 'Contact form submission from John Doe',
    body: 'Name: John Doe\nEmail: john.doe@example.com\nMessage: Hello, I would like to get in touch about your services.\nPhone: +1234567890'
  }
});
