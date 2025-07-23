import { createAction, Property } from '@activepieces/pieces-framework';
import { BitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuidDropdown } from '../common/props';
import { HttpMethod } from 'packages/pieces/community/common/src/lib/http/core/http-method';
import { makeRequest } from '../common/client';

export const archiveBitlink = createAction({
  auth: BitlyAuth,
  name: 'archiveBitlink',
  displayName: 'Archive Bitlink',
  description: '',
  props: {
    group_guid: groupGuidDropdown,
    bitlink: bitlinkDropdown,
  },
  async run({ auth, propsValue }) {
    // Action logic here
    const { bitlink } = propsValue;
    const response = await makeRequest(
      auth as string,
      HttpMethod.DELETE,
      `/bitlinks/${bitlink}`
    );
    return {
      success: true,
      message: `Bitlink ${bitlink} archived successfully.`,
      data: response,
    };
  },
});
