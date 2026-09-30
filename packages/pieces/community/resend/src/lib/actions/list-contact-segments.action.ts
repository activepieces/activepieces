import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { listContactSegmentsOutputSchema } from '../output-schemas';

export const listContactSegments = createAction({
  name: 'list_contact_segments',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Contact Segments',
  outputSchema: listContactSegmentsOutputSchema,
  description: 'List the segments a contact belongs to',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves every segment a contact (identified by ID or email) currently belongs to. Use this to check segment membership before adding or removing a contact from a segment. Read-only and idempotent.', idempotent: true },
  props: {
    contact_identifier: resendProps.contactIdentifier,
  },
  async run({ auth, propsValue }) {
    const result = await resendClient.sendRequest<{ data: { id: string; name: string; created_at: string }[] }>({ auth: auth.secret_text, method: HttpMethod.GET, path: `/contacts/${encodeURIComponent(propsValue.contact_identifier)}/segments` });
    return result.data;
  },
});
