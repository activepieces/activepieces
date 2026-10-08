import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { removeContactFromSegmentOutputSchema } from '../output-schemas';

export const removeContactFromSegment = createAction({
  name: 'remove_contact_from_segment',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Remove Contact From Segment',
  outputSchema: removeContactFromSegmentOutputSchema,
  description: 'Remove a contact from a segment',
  audience: 'ai',
  aiMetadata: { description: 'Removes a contact (identified by ID or email) from a segment (identified by segment ID). Use List Contact Segments to confirm current membership first. Effectively idempotent — once removed, repeating the call has no further effect.', idempotent: true },
  props: {
    contact_identifier: resendProps.contactIdentifier,
    segment_id: resendProps.segmentId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/contacts/${encodeURIComponent(propsValue.contact_identifier)}/segments/${propsValue.segment_id}` });
  },
});
