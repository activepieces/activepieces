import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';

export const clearWorksheetAction = createAction({
  auth: excelAuth,
  name: 'clear_worksheet',
  description: 'Clear a worksheet',
  displayName: 'Clear Worksheet',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range in A1 notation (e.g., A2:B2) to clear in the worksheet, if not provided, clear the entire worksheet',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
    const range = propsValue['range'];

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    let url = `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

    // If range is not provided, clear the entire worksheet
    if (!range) {
      url += 'usedRange(valuesOnly=true)/clear';
    } else {
      url += `range(address = '${range}')/clear`;
    }

    const request = {
      method: HttpMethod.POST,
      url: url,
      body: {
        applyTo: 'contents',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
