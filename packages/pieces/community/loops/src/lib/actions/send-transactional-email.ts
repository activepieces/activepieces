import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsProps, loopsSchemas } from '../common/schemas';

export const sendTransactionalEmail = createAction({
  name: 'send_transactional_email',
  classification: 'WRITE',
  displayName: 'Send Transactional Email',
  description: 'Sends a transactional email to a contact using a pre-built template in Loops.',
  audience: 'both',
  outputSchema: loopsSchemas.success,
  aiMetadata: {
    description:
      'Sends one transactional email to a single recipient using a published Loops transactional template (get its ID from list_transactional_emails), filling the template data variables and optionally adding the recipient to the audience. Not idempotent: each call delivers another email, unless the same idempotencyKey is reused within 24 hours (Loops then rejects it with 409).',
    idempotent: false,
  },
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'To Email',
      description: "The recipient's email address.",
      required: true,
    }),
    transactionalId: Property.ShortText({
      displayName: 'Transactional Email ID',
      description:
        'The ID of the published transactional email in Loops. Use "List Transactional Emails" or copy it from the Loops dashboard.',
      required: true,
    }),
    addToAudience: Property.Checkbox({
      displayName: 'Add to Audience',
      description: 'If true, the recipient will be added to your Loops audience if they are not already a contact.',
      required: false,
      defaultValue: false,
    }),
    dataVariables: Property.Object({
      displayName: 'Data Variables',
      description:
        'Key-value pairs to populate dynamic variables in your email template (e.g. { "name": "Alice", "resetUrl": "https://..." }).',
      required: false,
    }),
    idempotencyKey: loopsProps.idempotencyKeyProp(),
  },
  async run(context) {
    const { email, transactionalId, addToAudience, dataVariables, idempotencyKey } = context.propsValue;
    const body: Record<string, unknown> = { email, transactionalId };
    if (typeof addToAudience === 'boolean') body['addToAudience'] = addToAudience;
    if (loopsClient.isRecord(dataVariables)) body['dataVariables'] = dataVariables;
    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/transactional',
      body,
      idempotencyKey: idempotencyKey?.trim() || undefined,
    });
  },
});
