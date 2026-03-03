import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';

export const deleteWorksheetAction = createAction({
  auth: excelAuth,
  name: 'delete_worksheet',
  description: 'Delete a worksheet in a workbook',
  displayName: 'Delete Worksheet',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const request = {
      method: HttpMethod.DELETE,
      url: `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
