import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, normalizeEmail, parseMailingListId, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

function collectEmails(values: unknown[]): string[] {
  const invalid = values.filter((value) => {
    try {
      normalizeEmail(value);
      return false;
    } catch {
      return true;
    }
  });
  if (invalid.length > 0) {
    throw new Error(`Invalid email format(s): ${invalid.map((value) => String(value)).join(', ')}`);
  }
  return [...new Set(values.map((value) => normalizeEmail(value)))];
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'mailingListId', label: 'Mailing List ID' },
    { key: 'unsubscribed', label: 'Unsubscribed Emails' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const unsubscribeUserAction = createAction({
  auth: sendpulseAuth,
  name: 'unsubscribe-user',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe User',
  description: 'Remove subscribers from mailing list',
  audience: 'both',
  aiMetadata: { description: 'Removes one or more email addresses (up to 100 per call) from a single specified SendPulse mailing list, leaving them in other lists. Use to take contacts off one list rather than purge them account-wide. Idempotent — repeating leaves the same contacts off that list.', idempotent: true },
  props: {
    mailingListId: mailingListDropdown,
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Email addresses to unsubscribe (max 100)',
      required: true,
    }),
  },
  outputSchema,
  async run(context) {
    const { mailingListId } = context.propsValue;
    const listId = parseMailingListId(mailingListId);
    const emails = collectEmails(context.propsValue.emails ?? []);

    if (emails.length === 0) {
      throw new Error('At least one email address is required');
    }
    if (emails.length > 100) {
      throw new Error('Maximum 100 email addresses allowed per request');
    }

    const result = await sendpulseApiCall<unknown>({
      method: HttpMethod.DELETE,
      auth: context.auth.props,
      resourceUri: `/addressbooks/${listId}/emails`,
      operation: 'unsubscribe subscribers',
      body: { emails },
    });

    if (!isRecord(result) || result['result'] !== true) {
      throw new Error(`SendPulse unsubscribe failed: unexpected response ${JSON.stringify(result)}`);
    }
    return {
      success: true,
      message: `${emails.length} subscriber(s) unsubscribed successfully`,
      unsubscribed: emails,
      mailingListId,
      count: emails.length,
    };
  },
});
