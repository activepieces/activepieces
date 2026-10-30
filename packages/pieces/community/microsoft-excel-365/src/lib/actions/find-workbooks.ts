import { excelAuth } from '../auth';
import { createAction, OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const findWorkbookAction = createAction({
  auth: excelAuth,
  name: 'find-workbook',
  classification: 'SEARCH',
  displayName: 'Find Workbook',
  description: 'Find a workbook by its file name.',
  audience: 'both',
  aiMetadata: { description: 'Search a OneDrive or SharePoint drive for an .xlsx workbook by exact file name (the .xlsx extension is added if omitted), returning a found flag plus matching files. Use to resolve a workbook id from a known name before other actions; to browse all workbooks use Get Workbooks. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'drive',
      display: 'section',
      label: 'Drive',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId'],
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['fileName'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Exact name, with or without .xlsx.',
      placeholder: 'Budget 2026',
      required: true
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, fileName } = context.propsValue;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const fileNameWithExtension = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    const client = createMSGraphClient(context.auth.access_token, cloud);
    let response: PageCollection | undefined = await client
      .api(`${drivePath}/items/root/search(q='.xlsx')`)
      .select('id,name,lastModifiedDateTime,parentReference')
      .get();

    const result: DriveItem[] = [];
    while (response) {
      result.push(...(response.value ?? []).filter((item: DriveItem) => item.name === fileNameWithExtension));
      const nextLink = response['@odata.nextLink'];
      response = nextLink ? await client.api(nextLink).get() : undefined;
    }

    return {
      found: result.length > 0,
      data: result
    }
  }
})
