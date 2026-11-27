import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];

export const listFileMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_metadata',
  displayName: 'List File Metadata',
  description: 'Lists all metadata instances on a Box file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every metadata instance on a file, with each one\'s $scope and $template to use in Get, Update or Delete File Metadata. Not paged. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    hydrated: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Hydrated Taxonomy Values',
      description: '"true" returns taxonomy field values as full taxonomy nodes instead of node IDs.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.hydrated !== undefined && !BOOLEANS.includes(propsValue.hydrated)) {
      throw new Error('Hydrated Taxonomy Values must be "true" or "false".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata`,
      query: { view: propsValue.hydrated === 'true' ? 'hydrated' : undefined },
    });
  },
});
