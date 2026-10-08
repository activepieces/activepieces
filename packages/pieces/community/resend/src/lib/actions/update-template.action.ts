import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { updateTemplateOutputSchema } from '../output-schemas';

export const updateTemplate = createAction({
  name: 'update_template',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Update Template',
  outputSchema: updateTemplateOutputSchema,
  description: "Update an existing email template's content or metadata",
  audience: 'ai',
  aiMetadata: { description: 'Updates the name, alias, sender, subject, reply-to, or body of an existing email template, identified by ID or alias. Only supplied fields change. If the template was already published, changes apply as a new unpublished version until Publish Template is called again. Idempotent — re-applying the same values leaves the template unchanged.', idempotent: true },
  props: {
    template_id: resendProps.templateId,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    alias: Property.ShortText({ displayName: 'Alias', required: false }),
    from: Property.ShortText({ displayName: 'From', required: false }),
    subject: Property.ShortText({ displayName: 'Default Subject', required: false }),
    reply_to: Property.ShortText({ displayName: 'Reply To', required: false }),
    html: Property.LongText({ displayName: 'HTML Body', required: false }),
    text: Property.LongText({ displayName: 'Text Body', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.name) body['name'] = propsValue.name;
    if (propsValue.alias) body['alias'] = propsValue.alias;
    if (propsValue.from) body['from'] = propsValue.from;
    if (propsValue.subject) body['subject'] = propsValue.subject;
    if (propsValue.reply_to) body['reply_to'] = propsValue.reply_to;
    if (propsValue.html) body['html'] = propsValue.html;
    if (propsValue.text) body['text'] = propsValue.text;

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.PATCH, path: `/templates/${propsValue.template_id}`, body: body });
  },
});
