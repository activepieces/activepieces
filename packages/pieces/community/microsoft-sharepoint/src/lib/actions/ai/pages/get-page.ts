import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetPageOutputSchema } from '../../../output-schemas';

export const getPageAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_page',
  outputSchema: microsoftSharepointGetPageOutputSchema,
  displayName: 'Get Page',
  description: 'Gets a SharePoint site page with its sections and web parts.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one SharePoint site page with its metadata, title area and full canvas layout (horizontal sections, columns, vertical section and web parts). List Pages returns the page IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
  },
  async run({ auth, propsValue }) {
    const page: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId }))
      .expand('canvasLayout')
      .get();
    return page;
  },
});
