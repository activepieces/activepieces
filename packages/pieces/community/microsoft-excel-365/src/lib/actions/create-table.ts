import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

export const createTableAction = createAction({
  auth: excelAuth,
  name: 'create_table',
  description: 'Create a table in a worksheet',
  displayName: 'Create Table',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    selectRange: Property.StaticDropdown({
      displayName: 'Select Range',
      description: 'How to select the range for the table',
      required: true,
                defaultValue: 'auto',
      options:  {
          disabled: false,
          options: [
            {
              label: 'Automatically',
              value: 'auto',
            },
            {
              label: 'Manually',
              value: 'manual',
            },
          ],
        }
      
    }),
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range of cells in A1 notation (e.g., A2:B2) that will be converted to a table',
      required: false,
      defaultValue: 'A1:B2',
    }),
    hasHeaders: Property.Checkbox({
      displayName: 'Has Headers',
      description: 'Whether the range has column labels',
      required: true,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
    const selectRange = propsValue['selectRange'];
    const hasHeaders = propsValue['hasHeaders'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);

    let range: string | undefined;
    if (selectRange === 'auto') {
      const usedRangeResponse = await client
        .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`)
        .select('address')
        .get();
      range = usedRangeResponse.address.split('!')[1];
    } else {
      range = propsValue['range'];
    }

    const result = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/add`)
      .post({ address: range, hasHeaders });

    return result;
  },
});
