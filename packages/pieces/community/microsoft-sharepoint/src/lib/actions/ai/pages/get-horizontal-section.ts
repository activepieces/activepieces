import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointCreateHorizontalSectionOutputSchema } from '../../../output-schemas';

export const getHorizontalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_horizontal_section',
  outputSchema: microsoftSharepointCreateHorizontalSectionOutputSchema,
  displayName: 'Get Horizontal Section',
  description: 'Gets a horizontal section of a SharePoint site page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one horizontal section of a SharePoint site page with its layout, emphasis, columns and web parts. List Horizontal Sections returns the section IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
  },
  async run({ auth, propsValue }) {
    const section: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(microsoftSharePointPageCommon.horizontalSectionPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
      }))
      .get();
    return section;
  },
});
