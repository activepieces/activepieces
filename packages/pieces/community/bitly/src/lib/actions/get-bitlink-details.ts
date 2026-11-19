import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { bitlinkPath, bitlyApiCall, normalizeBitlinkId } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';
import { bitlinkOutputSchema } from '../common/schemas';

export const getBitlinkDetailsAction = createAction({
  auth: bitlyAuth,
  name: 'get_bitlink_details',
  classification: 'READ',
  displayName: 'Get Bitlink Details',
  description: 'Retrieve metadata for a Bitlink.',
  audience: 'human',
  aiMetadata: { description: 'Retrieves metadata for a single Bitlink (title, long URL, tags, archive status, timestamps) identified by its Bitlink ID. Read-only.', idempotent: true },
  outputSchema: bitlinkOutputSchema,
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
  },
  async run(context) {
    const id = normalizeBitlinkId(context.propsValue.bitlink);
    return bitlyApiCall({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: `/bitlinks/${bitlinkPath(id)}`,
      operation: 'get Bitlink',
    });
  },
});
