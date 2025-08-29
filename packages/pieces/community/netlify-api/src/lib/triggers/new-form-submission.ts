import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newFormSubmission = createTrigger({
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  description: 'Fires when a Netlify form submission is received',
  type: TriggerStrategy.WEBHOOK,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier of the Netlify site',
      required: true
    }),
    form_id: Property.ShortText({
      displayName: 'Form ID',
      description: 'Optional: Specific form ID to monitor (leave empty for all forms)',
      required: false
    }),
    form_name: Property.ShortText({
      displayName: 'Form Name',
      description: 'Optional: Specific form name to monitor (alternative to Form ID)',
      required: false
    })
  },
  sampleData: {
    id: "5f7b8c9d0e1f2a3b4c5d6e7f",
    form_id: "5235a7a00d61eec2d6001302",
    form_name: "contact",
    site_url: "https://example.netlify.app",
    name: "Contact Form",
    path: "/contact",
    created_at: "2023-10-20T14:30:00Z",
    data: {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello, I'm interested in your services!",
      phone: "+1234567890"
    },
    ordered_human_fields: [
      { name: "name", value: "John Doe" },
      { name: "email", value: "john@example.com" },
      { name: "message", value: "Hello, I'm interested in your services!" },
      { name: "phone", value: "+1234567890" }
    ],
    ip: "192.168.1.1",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  async onEnable(context) {
    const requestBody: any = {
      site_id: context.propsValue.site_id,
      type: 'url',
      event: 'submission_created',
      data: {
        url: context.webhookUrl
      }
    };

    // Add form-specific filtering if provided
    if (context.propsValue.form_id) {
      requestBody.form_id = context.propsValue.form_id;
    } else if (context.propsValue.form_name) {
      requestBody.form_name = context.propsValue.form_name;
    }

    const webhookResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.netlify.com/api/v1/hooks',
      headers: {
        'Authorization': `Bearer ${(context.auth as any).access_token}`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    await context.store.put('hookId', webhookResponse.body.id);
  },
  async onDisable(context) {
    const hookId = await context.store.get('hookId');
    if (hookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${hookId}`,
        headers: {
          'Authorization': `Bearer ${(context.auth as any).access_token}`
        }
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  }
});