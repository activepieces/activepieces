import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema } from '@activepieces/pieces-framework';
import { isRecord, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';

const outputSchema: OutputSchema = {
  fields: [
    {
      key: 'senders',
      label: 'Senders',
      labelKey: 'email',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listSendersAction = createAction({
  auth: sendpulseAuth,
  name: 'list_senders',
  classification: 'SEARCH',
  displayName: 'List Senders',
  description: 'List the sender addresses configured in your SendPulse account.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the sender email addresses configured in the SendPulse account with their display name and verification status. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema,
  async run(context) {
    const response = await sendpulseApiCall<unknown>({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: '/senders',
      operation: 'list senders',
    });
    const senders = (Array.isArray(response) ? response.filter(isRecord) : []).map((item) => ({
      name: item['name'] ?? null,
      email: item['email'] ?? null,
      status: item['status'] ?? null,
    }));
    return { senders, count: senders.length };
  },
});
