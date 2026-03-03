import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import { excelCommon } from '../common/common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';

// Define the response type for creating a worksheet for better type-safety
interface CreateWorksheetResponse {
  id: string;
  name: string;
  position: number;
  visibility: string;
}

export const createWorksheetAction = createAction({
  auth: excelAuth,
  name: 'create_worksheet',
  displayName: 'Create Worksheet',
  description:
    'Add a new worksheet (tab) to an existing workbook with optional default headers.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    name: Property.ShortText({
      displayName: 'Worksheet Name',
      description:
        "The name for the new worksheet. If not provided, a default name like 'Sheet1' will be assigned.",
      required: false
    }),
    headers: Property.Array({
      displayName: 'Headers',
      description:
        'Optional: A list of headers to add to the first row. A table will be created from these headers.',
      required: false
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, name, headers } = context.propsValue;
    const { access_token } = context.auth;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    // Step 1: Create the new worksheet
    const createWorksheetResponse =
      await httpClient.sendRequest<CreateWorksheetResponse>({
        method: HttpMethod.POST,
        url: `${drivePath}/items/${workbookId}/workbook/worksheets/add`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: access_token
        },
        body: {
          // Conditionally add the name property to the request body if it exists
          ...(name ? { name } : {})
        }
      });

    const newWorksheetName = createWorksheetResponse.body.name;

    // Step 2: If headers are provided, add them and create a table from them
    if (headers && Array.isArray(headers) && headers.length > 0) {
      const headersArray = headers as string[];

      // Calculate the table range, e.g., "A1:C1" for 3 headers
      const endColumn = excelCommon.numberToColumnName(headersArray.length);
      const address = `A1:${endColumn}1`;

      // Add the header values to the first row of the new worksheet
      await httpClient.sendRequest({
        method: HttpMethod.PATCH,
        url: `${drivePath}/items/${workbookId}/workbook/worksheets/${newWorksheetName}/range(address='${address}')`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: access_token
        },
        body: {
          values: [headersArray] // Values must be a 2D array
        }
      });

      // Create a table from the newly added header range
      const createTableResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${drivePath}/items/${workbookId}/workbook/worksheets/${newWorksheetName}/tables/add`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: access_token
        },
        body: {
          address: address,
          hasHeaders: true
        }
      });

      // Return the result of the table creation
      return createTableResponse.body;
    }

    // If no headers were provided, return the result of the worksheet creation
    return createWorksheetResponse.body;
  }
});
