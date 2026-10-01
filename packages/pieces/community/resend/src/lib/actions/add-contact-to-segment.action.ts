import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { addContactToSegmentOutputSchema } from '../output-schemas';

export const addContactToSegment = createAction({
  name: 'add_contact_to_segment',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Add Contact To Segment',
  outputSchema: addContactToSegmentOutputSchema,
  description: 'Add a contact to a segment',
  audience: 'ai',
  aiMetadata: { description: 'Adds an existing contact (identified by ID or email) to a segment (identified by segment ID), for targeted broadcasts. Use List Segments to find the segment ID. Idempotent — adding a contact already in the segment leaves it unchanged.', idempotent: true },
  props: {
    contact_identifier: resendProps.contactIdentifier,
    segment_id: resendProps.segmentId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: `/contacts/${encodeURIComponent(propsValue.contact_identifier)}/segments/${propsValue.segment_id}` });
  },
});
