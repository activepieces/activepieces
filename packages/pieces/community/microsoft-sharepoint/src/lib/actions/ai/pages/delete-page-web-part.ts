import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointDeletePageWebPartOutputSchema } from '../../../output-schemas';

export const deletePageWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_page_web_part',
  outputSchema: microsoftSharepointDeletePageWebPartOutputSchema,
  displayName: 'Delete Page Web Part',
  description: 'Deletes a web part from a SharePoint site page by its ID.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one web part from a SharePoint site page, found by its ID. List Page Web Parts returns the web part IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPartId: microsoftSharePointPageCommon.webPartId(),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/webParts/${encodeURIComponent(propsValue.webPartId)}`)
      .delete();
    return { deleted: true, pageId: propsValue.pageId, webPartId: propsValue.webPartId };
  },
});
