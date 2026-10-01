import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createTemplateOutputSchema } from '../output-schemas';

export const createTemplate = createAction({
  name: 'create_template',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Template',
  outputSchema: createTemplateOutputSchema,
  description: 'Create a new reusable email template',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new reusable email template from HTML (and optional plain text), returning its ID. The template starts as an unpublished draft — use Publish Template to make it available for sending. Not idempotent — each call creates a new template even if the name matches an existing one.', idempotent: false },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    html: Property.LongText({ displayName: 'HTML Body', required: true }),
    alias: Property.ShortText({
      displayName: 'Alias',
      description: 'Optional short alias that can be used instead of the template ID in other calls.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Default sender address. Must be from a verified domain.',
      required: false,
    }),
    subject: Property.ShortText({ displayName: 'Default Subject', required: false }),
    reply_to: Property.ShortText({ displayName: 'Reply To', required: false }),
    text: Property.LongText({
      displayName: 'Text Body',
      description: 'Plain text version. Auto-generated from the HTML body if left blank.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { name: propsValue.name, html: propsValue.html };
    if (propsValue.alias) body['alias'] = propsValue.alias;
    if (propsValue.from) body['from'] = propsValue.from;
    if (propsValue.subject) body['subject'] = propsValue.subject;
    if (propsValue.reply_to) body['reply_to'] = propsValue.reply_to;
    if (propsValue.text) body['text'] = propsValue.text;

    return await resendClient.sendRequest<{ id: string; object: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/templates', body: body });
  },
});
