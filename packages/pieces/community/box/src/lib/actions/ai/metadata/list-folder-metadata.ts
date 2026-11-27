import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];

export const listFolderMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_list_folder_metadata',
  displayName: 'List Folder Metadata',
  description: 'Lists all metadata instances on a Box folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every metadata instance on a folder, with each one\'s $scope and $template to use in Get, Update or Delete Folder Metadata. Not paged, and not available on the root folder "0". Get the folder ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({
      required: true,
      description: 'Box folder ID, not the root "0". Get it from List Folder Items, Search or Create Folder.',
    }),
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
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata`,
      query: { view: propsValue.hydrated === 'true' ? 'hydrated' : undefined },
    });
  },
});
