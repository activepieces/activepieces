import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointDeleteVerticalSectionWebPartOutputSchema } from '../../../output-schemas';

export const deleteVerticalSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_vertical_section_web_part',
  outputSchema: microsoftSharepointDeleteVerticalSectionWebPartOutputSchema,
  displayName: 'Delete Vertical Section Web Part',
  description: 'Deletes a web part from the vertical section of a SharePoint site page by its index.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one web part from the vertical section of a SharePoint site page, found by its index; later web parts move up one index. List Vertical Section Web Parts returns the web parts in index order.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPartIndex: microsoftSharePointPageCommon.webPartIndex({ listAction: 'List Vertical Section Web Parts' }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection/webparts/${encodeURIComponent(propsValue.webPartIndex)}`)
      .delete();
    return { deleted: true, pageId: propsValue.pageId, webPartIndex: propsValue.webPartIndex };
  },
});
