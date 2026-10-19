import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listSegmentsOutputSchema } from '../output-schemas';

export const listSegments = createAction({
  name: 'list_segments',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Segments',
  outputSchema: listSegmentsOutputSchema,
  description: 'Retrieve all segments in your Resend account',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves every segment defined on the account, including each one\'s ID and name. Use this to discover a segment ID (e.g. for Add Contact To Segment or targeting a broadcast) or to check whether a suitable segment already exists. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const result = await resendClient.sendRequest<{ data: { id: string; name: string; created_at: string }[] }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/segments' });
    return result.data;
  },
});
