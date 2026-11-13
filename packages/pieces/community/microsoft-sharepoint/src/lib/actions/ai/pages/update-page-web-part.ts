import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointAddSectionWebPartOutputSchema } from '../../../output-schemas';

export const updatePageWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_page_web_part',
  outputSchema: microsoftSharepointAddSectionWebPartOutputSchema,
  displayName: 'Update Page Web Part',
  description: 'Updates a web part on a SharePoint site page by its ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the content of one web part on a SharePoint site page, found by its ID. List Page Web Parts returns the web part IDs; changes stay in draft until Publish Page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPartId: microsoftSharePointPageCommon.webPartId(),
    webPart: microsoftSharePointPageCommon.webPart(),
  },
  async run({ auth, propsValue }) {
    const webPart: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/webParts/${encodeURIComponent(propsValue.webPartId)}`)
      .patch(microsoftSharePointPageCommon.webPartBody({ value: propsValue.webPart }));
    return webPart;
  },
});
