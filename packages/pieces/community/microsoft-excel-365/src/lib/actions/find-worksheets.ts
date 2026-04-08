import { excelAuth } from '../auth';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { getDrivePath } from '../common/helpers';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { WorkbookWorksheet } from '@microsoft/microsoft-graph-types';

export const findWorksheetAction = createAction({
  auth: excelAuth,
  name: 'find-worksheet',
  displayName: 'Find Worksheet',
  description: 'Finds an existing worksheet by name.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
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
    const { storageSource, siteId, documentId, sheetName, workbookId, exactMatch } = context.propsValue;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    const url = `${drivePath}/items/${workbookId}/workbook/worksheets`;

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
