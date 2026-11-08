import { createAction } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListFolderChildrenOutputSchema } from '../../../output-schemas';

export const listFolderChildrenAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_folder_children',
  outputSchema: microsoftSharepointListFolderChildrenOutputSchema,
  displayName: 'List Folder Children',
  description: 'Lists the files and folders inside a folder of a document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the files and folders directly inside one folder of a document library, or its root folder when Folder ID is empty, one page at a time. Use Find File or Search to look across folders; List Site Drives returns drive IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({
      required: false,
      displayName: 'Folder ID',
      description:
        'ID of the folder to list. Leave empty for the root folder of the drive. Use List Folder Children or Find File to find it.',
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    const folderPath = propsValue.itemId
      ? `items/${encodeURIComponent(propsValue.itemId)}`
      : 'root';
    return await microsoftSharePointClient.list<DriveItem>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/${folderPath}/children`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
