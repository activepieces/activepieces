import { createAction } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetDriveItemOutputSchema } from '../../../output-schemas';

export const getListItemFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_item_file',
  outputSchema: microsoftSharepointGetDriveItemOutputSchema,
  displayName: 'Get List Item File',
  description: 'Gets the file or folder behind an item of a document library list.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the file or folder (drive item) behind one item of a document library list, including its drive ID and item ID for the file actions. Only works on lists that are document libraries; List List Items returns the list item IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const item: DriveItem = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/driveItem`
      )
      .get();
    return item;
  },
});
