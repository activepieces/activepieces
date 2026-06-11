import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { pageTemplateDropdown, sendrApiCall, flattenObject } from '../common';

export const generateSendrPage = createAction({
  auth: sendrAuth,
  name: 'generate_sendr_page',
  displayName: 'Generate Sendr Page',
  description: 'Creates a personalized Sendr landing page from a template with custom variables.',
  audience: 'both',
  aiMetadata: { description: 'Creates a personalized Sendr landing page by rendering a template with supplied variable values; optionally screenshots a website background, renders an animated GIF, and posts status updates to a callback URL. Requires a template id and a key-value variables object (use Get Page Template Variables to find the keys). Not idempotent: each call generates a new page.', idempotent: false },
  props: {
    instructions: Property.MarkDown({
      value: `### How to Generate a Page
1. Choose a **Page Template** below.
2. Fill in the variable values (e.g. first_name = "Anna", company = "Acme").
3. Optionally provide a website URL to screenshot, or enable GIF/audio rendering.`,
    }),
    template: pageTemplateDropdown,
    websiteUrl: Property.ShortText({
      displayName: 'Website to Screenshot URL',
      description: 'Optional. Provide a website URL if the template supports background screenshots.',
      required: false,
    }),
    renderGif: Property.Checkbox({
      displayName: 'Render GIF',
      description: 'If enabled, Sendr will generate an animated GIF version of the page.',
      required: false,
      defaultValue: false,
    }),
    attributes: Property.Object({
      displayName: 'Page Attributes',
      description: 'Optional metadata attributes for the generated page (key-value pairs).',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Optional callback URL to receive status updates (e.g. when GIF or audio is ready).',
      required: false,
    }),
    variables: Property.Object({
      displayName: 'Template Variables',
      description: 'Key-value pairs matching the template variables. Example: { "first_name": "Anna", "company": "Acme Inc" }',
      required: true,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      templateId: context.propsValue.template,
      variablesValues: context.propsValue.variables,
    };
    if (context.propsValue.websiteUrl) {
      body['websiteToScreenshotUrl'] = context.propsValue.websiteUrl;
    }
    if (context.propsValue.renderGif) {
      body['renderGif'] = true;
    }
    if (context.propsValue.attributes) {
      body['attributes'] = context.propsValue.attributes;
    }
    if (context.propsValue.webhookUrl) {
      body['webhookUrl'] = context.propsValue.webhookUrl;
    }
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/enrichment/sendr-page',
      body,
    });
    return flattenObject(response.body);
  },
});
