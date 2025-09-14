import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { VlmRunAuth } from '../common/auth';
import { FileIDDropdown } from '../common/dropdown';

export const getFileById = createAction({
  auth: VlmRunAuth,
  name: 'get_file_by_id',
  displayName: 'Get File by ID',
  description: 'Fetch metadata of a file by its ID from VLM Run.',
  props: {
    file_id: FileIDDropdown,
  },
  async run(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/files/${context.propsValue.file_id}`
    );

    return response;
  },
});
