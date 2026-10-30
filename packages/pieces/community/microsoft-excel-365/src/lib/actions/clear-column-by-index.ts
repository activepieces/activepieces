import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

export const clearColumnAction = createAction({
  auth: excelAuth,
  name: 'clear_column',
  classification: 'DESTRUCTIVE',
  displayName: 'Clear Column',
  description: 'Clear the contents or formatting of a column.',
  audience: 'both',
  aiMetadata: { description: 'Clear an entire column in a worksheet identified by its 1-based index (1 = A, 2 = B). Choose what to remove via Clear Type: contents, formats, or both. Clears in place without shifting other cells; idempotent — re-running on an already-cleared column has no further effect. To clear a row instead use Clear Row by ID, or a specific range with Clear Worksheet.', idempotent: true },
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId']
    },
    {
      key: 'column',
      display: 'section',
      label: 'Column',
      icon: 'markdown',
      props: ['column_index', 'applyTo', 'clear_warning']
    }
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    column_index: Property.Number({
      displayName: 'Column Number',
      description: '1 is column A, 2 is column B.',
      required: true
    }),
    applyTo: Property.StaticDropdown({
      displayName: 'What to Clear',
      required: true,
      defaultValue: 'All',
      display: 'cards',
      options: {
        options: [
          {
            label: 'Everything',
            value: 'All',
            icon: 'trash'
          },
          {
            label: 'Contents',
            value: 'Contents',
            icon: 'text'
          },
          {
            label: 'Formatting',
            value: 'Formats',
            icon: 'sliders'
          }
        ]
      }
    }),
    clear_warning: Property.MarkDown({
      value: 'Cleared cells cannot be restored.',
      variant: MarkdownVariant.WARNING
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, column_index, applyTo } =
      context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    if (
      typeof column_index !== 'number' ||
      !Number.isInteger(column_index) ||
      column_index < 1
    ) {
      throw new Error('Column index must be a positive integer.');
    }

    const columnLetter = excelCommon.numberToColumnName(column_index);

    const columnAddress = `${columnLetter}:${columnLetter}`;

    const client = createMSGraphClient(access_token, cloud);
    await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${columnAddress}')/clear`)
      .post({ applyTo: applyTo });

    return {};
  }
});
