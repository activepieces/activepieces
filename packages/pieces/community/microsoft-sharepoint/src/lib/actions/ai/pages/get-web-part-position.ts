import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetWebPartPositionOutputSchema } from '../../../output-schemas';

export const getWebPartPositionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_web_part_position',
  outputSchema: microsoftSharepointGetWebPartPositionOutputSchema,
  displayName: 'Get Web Part Position',
  description: 'Gets where a web part sits on a SharePoint site page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the section, column and index of one web part on a SharePoint site page, found by its ID. List Page Web Parts returns the web part IDs; Get Web Parts by Position does the reverse lookup.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPartId: microsoftSharePointPageCommon.webPartId(),
  },
  async run({ auth, propsValue }) {
    const position: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/webParts/${encodeURIComponent(propsValue.webPartId)}/getPositionOfWebPart`)
      .get();
    return position;
  },
});
