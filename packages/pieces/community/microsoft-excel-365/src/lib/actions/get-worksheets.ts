import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';

export const getWorksheetsAction = createAction({
  auth: excelAuth,
  name: 'get_worksheets',
  description: 'Retrieve worksheets from a workbook',
  displayName: 'Get Worksheets',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    returnAll: Property.Checkbox({
      displayName: 'Return All',
      description: 'If checked, all worksheets will be returned',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of worksheets returned',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId } = propsValue;
    const returnAll = propsValue['returnAll'];
    const limit = propsValue['limit'];

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const endpoint = `${drivePath}/items/${workbookId}/workbook/worksheets`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: endpoint,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to retrieve worksheet: ${response.body}`);
    }

    const worksheets = response.body['value'];

    if (returnAll) {
      return worksheets;
    } else {
      const limitedWorksheets = [];
      for (let i = 0; i < Math.min(worksheets['length'], limit ?? 0); i++) {
        limitedWorksheets.push(worksheets[i]);
      }
      return limitedWorksheets;
    }
  },
});
