import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, normalizeEmail, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';

const outputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'email', label: 'Email', format: 'email' },
  ],
};

export const deleteContactAction = createAction({
  auth: sendpulseAuth,
  name: 'delete-contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently delete contact from all mailing lists',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a contact, identified by email, from every SendPulse mailing list (address book) in the account at once. Use to fully purge a contact rather than unsubscribe from a single list. Destructive but idempotent — once deleted, repeating the call leaves the contact absent.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to delete from all mailing lists',
      required: true,
    }),
  },
  outputSchema,
  async run(context) {
    const email = normalizeEmail(context.propsValue.email);

    const result = await sendpulseApiCall<unknown>({
      method: HttpMethod.DELETE,
      auth: context.auth.props,
      resourceUri: `/emails/${encodeURIComponent(email)}`,
      operation: 'delete contact',
    });

    if (!isRecord(result) || result['result'] !== true) {
      throw new Error(`SendPulse delete contact failed: unexpected response ${JSON.stringify(result)}`);
    }
    return {
      success: true,
      message: `Contact ${email} deleted from all mailing lists`,
      email,
    };
  },
});
