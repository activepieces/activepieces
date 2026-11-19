import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { bitlinkPath, bitlyApiCall, normalizeBitlinkId } from '../../common/client';
import { bitlinkOutputSchema } from '../../common/schemas';

export const aiGetBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'ai_get_bitlink',
  classification: 'READ',
  displayName: 'Get Bitlink',
  description: 'Get one Bitlink by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Gets one Bitlink (long URL, title, tags, archived, created_at) by Bitlink ID such as bit.ly/abc123; a full short URL like https://bit.ly/abc123 is accepted. Find IDs with Search Bitlinks. Read-only.',
    idempotent: true,
  },
  outputSchema: bitlinkOutputSchema,
  props: {
    bitlink_id: Property.ShortText({
      displayName: 'Bitlink ID',
      description: 'For example bit.ly/abc123.',
      required: true,
    }),
  },
  async run(context) {
    const id = normalizeBitlinkId(context.propsValue.bitlink_id);
    return bitlyApiCall({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: `/bitlinks/${bitlinkPath(id)}`,
      operation: 'get Bitlink',
    });
  },
});
