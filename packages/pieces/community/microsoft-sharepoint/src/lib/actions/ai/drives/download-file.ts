import { createAction } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointDownloadFileOutputSchema } from '../../../output-schemas';

export const downloadFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_download_file',
  outputSchema: microsoftSharepointDownloadFileOutputSchema,
  displayName: 'Download File',
  description: 'Downloads the current content of a file in a document library.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the current content of one file in a document library and returns it as a file with the item metadata. Folders are rejected; use Download Shared File for a sharing link and Get Drive Item for metadata only. List Folder Children, Find File and Search return item IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue, files }) {
    const client = microsoftSharePointClient.create({ auth });
    const itemPath = `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`;
    const item: DriveItem = await client.api(itemPath).get();
    if (!item.file) {
      throw new Error(
        `"${item.name ?? propsValue.itemId}" is a folder, not a file, so it cannot be downloaded. Use List Folder Children to see what it contains.`
      );
    }
    const data = await microsoftSharePointClient.download({ auth, path: `${itemPath}/content` });
    const fileName = item.name ?? propsValue.itemId;
    const file = await files.write({ fileName, data });
    return { file, fileName, item };
  },
});
