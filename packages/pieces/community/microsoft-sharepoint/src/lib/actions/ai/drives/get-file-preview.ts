import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemPreviewInfo } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetFilePreviewOutputSchema } from '../../../output-schemas';

export const getFilePreviewAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_file_preview',
  outputSchema: microsoftSharepointGetFilePreviewOutputSchema,
  displayName: 'Get File Preview',
  description: 'Gets a short-lived URL to embed a preview of a file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets short-lived URLs that embed a read-only preview of a file in a web page or iframe, optionally starting at a page and zoom level. Use Download File for the content itself; List Folder Children, Find File and Search return item IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    page: Property.ShortText({
      displayName: 'Page',
      description: 'Page number of the document to start at, like "2", if the file has pages.',
      required: false,
    }),
    zoom: Property.Number({
      displayName: 'Zoom',
      description: 'Zoom level to start at, if the preview app supports it.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const preview: ItemPreviewInfo = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/preview`
      )
      .post({
        ...(propsValue.page !== undefined ? { page: propsValue.page } : {}),
        ...(propsValue.zoom !== undefined ? { zoom: propsValue.zoom } : {}),
      });
    return preview;
  },
});
