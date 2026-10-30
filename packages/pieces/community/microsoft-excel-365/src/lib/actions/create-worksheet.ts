import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

export const createWorksheetAction = createAction({
  auth: excelAuth,
  name: 'create_worksheet',
  classification: 'WRITE',
  displayName: 'Create Worksheet',
  description: 'Add a worksheet, optionally with a header row.',
  audience: 'both',
  aiMetadata: { description: 'Add a new worksheet (tab) to an existing workbook, optionally writing a header row and creating an Excel table from it. Use to provision a sheet for new data; to add data to an existing sheet use the append/update actions. Not idempotent — re-running creates another worksheet (Excel auto-assigns a default name like Sheet1 when none is given).', idempotent: false },
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId'],
    },
    {
      key: 'new_worksheet',
      display: 'section',
      label: 'New Worksheet',
      icon: 'file',
      props: ['name', 'headers'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    name: Property.ShortText({
      displayName: 'Worksheet Name',
      description: 'Empty lets Excel pick a name.',
      placeholder: 'Sheet2',
      required: false
    }),
    headers: Property.Array({
      displayName: 'Headers',
      description: 'Written to row 1 and turned into a table.',
      required: false
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, name, headers } = context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(access_token, cloud);

    const createWorksheetResponse: CreateWorksheetResponse = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/add`)
      .post({ ...(name ? { name } : {}) });

    const newWorksheetName = createWorksheetResponse.name;

    if (headers && Array.isArray(headers) && headers.length > 0) {
      const headersArray = headers as string[];

      const endColumn = excelCommon.numberToColumnName(headersArray.length);
      const address = `A1:${endColumn}1`;

      await client
        .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${newWorksheetName}/range(address='${address}')`)
        .patch({ values: [headersArray] });

      const createTableResponse = await client
        .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${newWorksheetName}/tables/add`)
        .post({ address: address, hasHeaders: true });

      return createTableResponse;
    }

    return createWorksheetResponse;
  }
});

interface CreateWorksheetResponse {
  id: string;
  name: string;
  position: number;
  visibility: string;
}
