import { createAction } from '@activepieces/pieces-framework';
import type { ThumbnailSet } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import type { GraphPage } from '../../../common/types';
import { microsoftSharepointListThumbnailsOutputSchema } from '../../../output-schemas';

export const listThumbnailsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_thumbnails',
  outputSchema: microsoftSharepointListThumbnailsOutputSchema,
  displayName: 'List Thumbnails',
  description: 'Lists the thumbnail images of a file or folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the thumbnail sets of one file or folder, each with small, medium and large image URLs and sizes. Files without a preview return an empty list; List Folder Children, Find File and Search return item IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const thumbnails: GraphPage<ThumbnailSet> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/thumbnails`
      )
      .get();
    return thumbnails;
  },
});
