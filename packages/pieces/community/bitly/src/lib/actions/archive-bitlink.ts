import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { bitlinkPath, bitlyApiCall, normalizeBitlinkId } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';
import { bitlinkOutputSchema } from '../common/schemas';

export const archiveBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'archive_bitlink',
  classification: 'WRITE',
  displayName: 'Archive Bitlink',
  description: 'Archive a Bitlink to stop redirects. It can be restored with Update Bitlink.',
  audience: 'human',
  aiMetadata: { description: 'Archives an existing Bitlink so it stops redirecting, identified by its Bitlink ID (e.g. bit.ly/xyz123). Reversible with Update Bitlink. Idempotent: re-archiving an already-archived link leaves it archived.', idempotent: true },
  outputSchema: bitlinkOutputSchema,
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
  },
  async run(context) {
    const id = normalizeBitlinkId(context.propsValue.bitlink);
    return bitlyApiCall({
      method: HttpMethod.PATCH,
      auth: context.auth.props,
      resourceUri: `/bitlinks/${bitlinkPath(id)}`,
      body: { archived: true },
      operation: 'archive Bitlink',
    });
  },
});
