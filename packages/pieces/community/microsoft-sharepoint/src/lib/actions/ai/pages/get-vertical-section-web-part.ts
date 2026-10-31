import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointAddSectionWebPartOutputSchema } from '../../../output-schemas';

export const getVerticalSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_vertical_section_web_part',
  outputSchema: microsoftSharepointAddSectionWebPartOutputSchema,
  displayName: 'Get Vertical Section Web Part',
  description: 'Gets a web part in the vertical section of a SharePoint site page by its index.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one web part in the vertical section of a SharePoint site page by its index. List Vertical Section Web Parts returns the web parts in index order.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPartIndex: microsoftSharePointPageCommon.webPartIndex({ listAction: 'List Vertical Section Web Parts' }),
  },
  async run({ auth, propsValue }) {
    const webPart: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection/webparts/${encodeURIComponent(propsValue.webPartIndex)}`)
      .get();
    return webPart;
  },
});
