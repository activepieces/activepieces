import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointDeleteHorizontalSectionOutputSchema } from '../../../output-schemas';

export const deleteHorizontalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_horizontal_section',
  outputSchema: microsoftSharepointDeleteHorizontalSectionOutputSchema,
  displayName: 'Delete Horizontal Section',
  description: 'Deletes a horizontal section from a SharePoint site page.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one horizontal section from a SharePoint site page together with its columns and web parts. List Horizontal Sections returns the section IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(microsoftSharePointPageCommon.horizontalSectionPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
      }))
      .delete();
    return { deleted: true, pageId: propsValue.pageId, horizontalSectionId: propsValue.horizontalSectionId };
  },
});
