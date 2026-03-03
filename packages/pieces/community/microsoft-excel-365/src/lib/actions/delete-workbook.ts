import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';

export const deleteWorkbookAction = createAction({
  auth: excelAuth,
  name: 'delete_workbook',
  description: 'Delete a workbook',
  displayName: 'Delete Workbook',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId } = propsValue;
    const accessToken = auth['access_token'];

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${drivePath}/items/${workbookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    await httpClient.sendRequest(request);
    return { success: true };
  },
});
