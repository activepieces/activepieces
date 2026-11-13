import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointCreateHorizontalSectionOutputSchema } from '../../../output-schemas';

export const createHorizontalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_horizontal_section',
  outputSchema: microsoftSharepointCreateHorizontalSectionOutputSchema,
  displayName: 'Create Horizontal Section',
  description: 'Creates a horizontal section on a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a horizontal section on a SharePoint site page with a column layout, optionally with its columns and web parts. Microsoft Graph requires a new section ID that the page does not use yet (List Horizontal Sections shows the ones in use). Use Add Section Web Part to add content to an existing column later; changes stay in draft until Publish Page.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    layout: microsoftSharePointPageCommon.layout({ required: true }),
    emphasis: microsoftSharePointPageCommon.emphasis({ required: false }),
    sectionId: Property.ShortText({
      displayName: 'Section ID',
      description:
        'ID for the new section, a number like "2" sent as text that the page does not use yet. Use List Horizontal Sections to see the IDs in use.',
      required: true,
    }),
    columns: Property.Json({
      displayName: 'Columns',
      description:
        'Columns of the section as a JSON list, like [{"id": "1", "width": 12, "webparts": [{"id": "<new GUID>", "innerHtml": "<p>Hello</p>"}]}]. Leave empty for empty columns.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const section: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/horizontalSections`
      )
      .post({
        id: propsValue.sectionId,
        ...microsoftSharePointPageCommon.layoutValue({ value: propsValue.layout }),
        ...microsoftSharePointPageCommon.emphasisValue({ value: propsValue.emphasis }),
        ...microsoftSharePointPageCommon.jsonList({ key: 'columns', value: propsValue.columns, propName: 'Columns' }),
      });
    return section;
  },
});
