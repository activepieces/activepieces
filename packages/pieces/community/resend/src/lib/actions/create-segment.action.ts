import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createSegmentOutputSchema } from '../output-schemas';

export const createSegment = createAction({
  name: 'create_segment',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Segment',
  outputSchema: createSegmentOutputSchema,
  description: 'Create a new segment for grouping contacts',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new empty segment (a named group of contacts) and returns its ID. Use this before adding contacts to it with Add Contact To Segment, or before targeting it with a broadcast. Not idempotent — each call creates a new segment even if the name matches an existing one.', idempotent: false },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'A label for this segment.', required: true }),
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; name: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/segments', body: { name: propsValue.name } });
  },
});
