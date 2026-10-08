import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getSegmentOutputSchema } from '../output-schemas';

export const getSegment = createAction({
  name: 'get_segment',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Segment',
  outputSchema: getSegmentOutputSchema,
  description: 'Retrieve a single segment by its ID',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves the name and creation date of a single segment by its ID. Use List Segments to find the ID. Read-only and idempotent.', idempotent: true },
  props: {
    segment_id: resendProps.segmentId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/segments/${propsValue.segment_id}` });
  },
});
