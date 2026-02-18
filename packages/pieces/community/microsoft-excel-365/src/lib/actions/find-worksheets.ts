import { excelAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { WorkbookWorksheet } from '@microsoft/microsoft-graph-types';

export const findWorksheetAction = createAction({
  auth: excelAuth,
  name: 'find-worksheet',
  displayName: 'Find Worksheet',
  description: 'Finds an existing worksheet by name.',
  props: {
    workbookId: excelCommon.workbook_id,
    sheetName: Property.ShortText({
      displayName: 'Worksheet Name',
      required: true,
    }),
    exactMatch: Property.Checkbox({
      displayName: 'Exact Match',
      description:
        'If true, only return worksheets that exactly match the name. If false, return worksheets that contain the name.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { sheetName, workbookId, exactMatch } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const url = `/me/drive/items/${workbookId}/workbook/worksheets`;

    const response: PageCollection = await client.api(url).get();

    const worksheets = response.value as WorkbookWorksheet[] ?? [];

    const normalizedSearchName = sheetName.toLowerCase();

    const matchedSheets = worksheets.filter((sheet)=>{
        const title = sheet.name?.toLowerCase() ?? '';
        return exactMatch ? normalizedSearchName === title : title.includes(normalizedSearchName)
    })

    return {
      found: matchedSheets.length > 0,
      data: matchedSheets,
    };
  },
});
