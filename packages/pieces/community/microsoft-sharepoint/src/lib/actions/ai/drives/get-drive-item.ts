import { createAction } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetDriveItemOutputSchema } from '../../../output-schemas';

export const getDriveItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_drive_item',
  outputSchema: microsoftSharepointGetDriveItemOutputSchema,
  displayName: 'Get Drive Item',
  description: 'Gets the metadata of a file or folder in a document library.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the metadata of one file or folder in a document library: name, size, URL, parent folder, timestamps and file or folder details. Use Download File to get the content; List Folder Children, Find File and Search return item IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const item: DriveItem = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`
      )
      .get();
    return item;
  },
});
