import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetWebPartsByPositionOutputSchema } from '../../../output-schemas';

export const getWebPartsByPositionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_web_parts_by_position',
  outputSchema: microsoftSharepointGetWebPartsByPositionOutputSchema,
  displayName: 'Get Web Parts by Position',
  description: 'Gets the web parts at a position on a SharePoint site page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the web parts at a position on a SharePoint site page: a horizontal section, a column in it, the vertical section, or one index within a column or the vertical section. Get Page or List Horizontal Sections returns the section and column IDs; Get Web Part Position does the reverse lookup.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: Property.ShortText({
      displayName: 'Horizontal Section ID',
      description: 'ID of the horizontal section, a number like "1" sent as text. Use List Horizontal Sections to find it.',
      required: false,
    }),
    columnId: Property.ShortText({
      displayName: 'Column ID',
      description: 'ID of the column in the horizontal section, a number like "1" sent as text. Needs Horizontal Section ID.',
      required: false,
    }),
    isInVerticalSection: Property.StaticDropdown({
      displayName: 'In Vertical Section',
      description: 'Set to true to get the web parts in the vertical section.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
      },
    }),
    webPartIndex: Property.ShortText({
      displayName: 'Web Part Index',
      description: 'Position of the web part, a number like "0" sent as text. Needs Column ID or In Vertical Section set to true.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const isInVerticalSection = microsoftSharePointUtils.booleanChoice({
      value: propsValue.isInVerticalSection,
      propName: 'In Vertical Section',
    });
    const query = {
      ...optionalText({ key: 'horizontalSectionId', value: propsValue.horizontalSectionId }),
      ...optionalText({ key: 'columnId', value: propsValue.columnId }),
      ...(isInVerticalSection === undefined ? {} : { isInVerticalSection: String(isInVerticalSection) }),
      ...optionalText({ key: 'webPartIndex', value: propsValue.webPartIndex }),
    };
    if (Object.keys(query).length === 0) {
      throw new Error('Set at least one of Horizontal Section ID, Column ID, In Vertical Section or Web Part Index.');
    }
    if (hasText({ value: propsValue.columnId }) && !hasText({ value: propsValue.horizontalSectionId })) {
      throw new Error('Column ID needs Horizontal Section ID.');
    }
    if (hasText({ value: propsValue.webPartIndex }) && !hasText({ value: propsValue.columnId }) && isInVerticalSection !== true) {
      throw new Error('Web Part Index needs Column ID or In Vertical Section set to true.');
    }
    const result: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/getWebPartsByPosition`
      )
      .query(query)
      .get();
    return result;
  },
});

function optionalText({ key, value }: { key: string; value: string | undefined }): Record<string, string> {
  return value === undefined || value === '' ? {} : { [key]: value };
}

function hasText({ value }: { value: string | undefined }): boolean {
  return value !== undefined && value !== '';
}
