import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteSegmentOutputSchema } from '../output-schemas';

export const deleteSegment = createAction({
  name: 'delete_segment',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Segment',
  outputSchema: deleteSegmentOutputSchema,
  description: 'Permanently delete a segment',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a segment by its ID; contacts themselves are not deleted, only their membership in this segment. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
  props: {
    segment_id: resendProps.segmentId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/segments/${propsValue.segment_id}` });
  },
});
