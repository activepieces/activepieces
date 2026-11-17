import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listSequenceEmails = createAction({
  auth: villageAuth,
  name: 'list_sequence_emails',
  classification: 'SEARCH',
  displayName: 'List Sequence Emails',
  description: 'List the emails of a sequence (drafts, scheduled, sent) with their status. Free.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists emails in one sequence with subject, recipient, status and send times, optionally filtered by status. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listSequenceEmails,
  props: {
    sequence_id: Property.ShortText({ displayName: 'Sequence ID', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
          { label: 'Failed', value: 'failed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
  },
  async run(context) {
    const { sequence_id, status } = context.propsValue;
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/sequences/${sequencePath(sequence_id)}/emails`,
      queryParams: { status: status ?? undefined },
    });
  },
});

function sequencePath(id: string | undefined): string {
  return villageApi.encodePathId(villageApi.requireText({ value: id, field: 'Sequence ID' }));
}
