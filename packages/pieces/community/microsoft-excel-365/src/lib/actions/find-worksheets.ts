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
  classification: 'SEARCH',
  displayName: 'Find Worksheet',
  description: 'Find worksheets by name.',
  audience: 'both',
  aiMetadata: { description: 'Search a workbook for worksheets whose name matches a search string, returning a found flag plus the matching sheets. By default matches sheets that contain the string (case-insensitive); enable Exact Match for an exact-name match only. Use to locate a sheet by name; to list every sheet use Get Worksheets. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId'],
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['sheetName', 'exactMatch'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    sheetName: Property.ShortText({
      displayName: 'Worksheet Name',
      placeholder: 'Sheet1',
      required: true,
    }),
    exactMatch: Property.Checkbox({
      displayName: 'Exact Match',
      description: 'Off also finds names that contain the text.',
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
