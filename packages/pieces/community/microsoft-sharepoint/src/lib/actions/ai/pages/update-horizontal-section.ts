import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointCreateHorizontalSectionOutputSchema } from '../../../output-schemas';

export const updateHorizontalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_horizontal_section',
  outputSchema: microsoftSharepointCreateHorizontalSectionOutputSchema,
  displayName: 'Update Horizontal Section',
  description: 'Updates the layout or emphasis of a horizontal section on a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the given layout and emphasis of one horizontal section on a SharePoint site page. List Horizontal Sections returns the section IDs; changes stay in draft until Publish Page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    layout: microsoftSharePointPageCommon.layout({ required: false }),
    emphasis: microsoftSharePointPageCommon.emphasis({ required: false }),
  },
  async run({ auth, propsValue }) {
    const changes = {
      ...microsoftSharePointPageCommon.layoutValue({ value: propsValue.layout }),
      ...microsoftSharePointPageCommon.emphasisValue({ value: propsValue.emphasis }),
    };
    if (Object.keys(changes).length === 0) {
      throw new Error('Set Layout or Emphasis to update.');
    }
    const section: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(
        microsoftSharePointPageCommon.horizontalSectionPath({
          siteId: propsValue.siteId,
          pageId: propsValue.pageId,
          horizontalSectionId: propsValue.horizontalSectionId,
        })
      )
      .patch(changes);
    return section;
  },
});
