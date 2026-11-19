import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, normalizeEmail, sendpulseApiCall, sendpulseErrorStatus } from '../common/client';
import { sendpulseAuth } from '../common/auth';

function isNotFound(error: unknown): boolean {
  const status = sendpulseErrorStatus(error);
  if (status === 404) {
    return true;
  }
  const message = error instanceof Error ? error.message : '';
  return status === 400 && /not\s*found|does not exist|no such email/i.test(message);
}

function toMembership(item: Record<string, unknown>) {
  return {
    book_id: item['book_id'] ?? item['address_book_id'] ?? null,
    email: item['email'] ?? null,
    phone: item['phone'] ?? null,
    status: item['status'] ?? null,
    status_explain: item['status_explain'] ?? null,
    variables: item['variables'] ?? {},
  };
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'email', label: 'Email', format: 'email' },
    {
      key: 'lists',
      label: 'Mailing List Memberships',
      labelKey: 'book_id',
      listItems: [
        { key: 'book_id', label: 'Mailing List ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status' },
        { key: 'status_explain', label: 'Status Description' },
        { key: 'variables', label: 'Variables', dynamicKey: true },
      ],
    },
  ],
};

export const getContactAction = createAction({
  auth: sendpulseAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Find a contact by email and see every mailing list it belongs to.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up one email address across all SendPulse mailing lists and returns each list membership (mailing list ID, status, variables). Returns found: false with an empty lists array when the email is in no list; that is not an error. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to look up',
      required: true,
    }),
  },
  outputSchema,
  async run(context) {
    const email = normalizeEmail(context.propsValue.email);
    try {
      const response = await sendpulseApiCall<unknown>({
        method: HttpMethod.GET,
        auth: context.auth.props,
        resourceUri: `/emails/${encodeURIComponent(email)}`,
        operation: 'get contact',
      });
      const items = Array.isArray(response) ? response.filter(isRecord) : isRecord(response) && 'book_id' in response ? [response] : [];
      return { found: items.length > 0, email, lists: items.map(toMembership) };
    } catch (error) {
      if (isNotFound(error)) {
        return { found: false, email, lists: [] };
      }
      throw error;
    }
  },
});
