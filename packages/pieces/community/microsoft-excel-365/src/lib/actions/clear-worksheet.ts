import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const clearWorksheetAction = createAction({
  auth: excelAuth,
  name: 'clear_worksheet',
  classification: 'DESTRUCTIVE',
  description: 'Clear the values of a worksheet or a range in it.',
  audience: 'both',
  aiMetadata: { description: 'Clear cell contents from a worksheet — either a specific A1-notation range (e.g. A2:B2) or, when no range is given, the entire used range. Removes values only (not formatting) and does not delete rows or shift cells. Idempotent — re-running over the same area has no further effect.', idempotent: true },
  displayName: 'Clear Worksheet',
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
    },
    {
      key: 'range',
      display: 'section',
      label: 'Range',
      icon: 'markdown',
      props: ['range', 'clear_warning'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    range: Property.ShortText({
      displayName: 'Range',
      description: 'Cells in A1 notation. Empty clears every used cell.',
      placeholder: 'A1:C10',
      required: false,
    }),
    clear_warning: Property.MarkDown({
      value: 'Cleared values cannot be restored. Formatting is kept.',
      variant: MarkdownVariant.WARNING,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
    const range = propsValue['range'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    let url = `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

    if (!range) {
      url += 'usedRange(valuesOnly=true)/clear';
    } else {
      url += `range(address = '${range}')/clear`;
    }

    const client = createMSGraphClient(auth['access_token'], cloud);
    await client.api(url).post({ applyTo: 'contents' });
    return {};
  },
});
