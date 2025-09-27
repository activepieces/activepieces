import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';
import {
    httpClient,
    HttpMethod,
    AuthenticationType,
} from '@activepieces/pieces-common';


interface CreateWorksheetResponse {
    id: string;
    name: string;
    position: number;
    visibility: string;
}

export const createWorksheet = createAction({
    auth: excelAuth,
    name: 'createWorksheet',
    displayName: 'Create Worksheet',
    description: 'Add a new worksheet (tab) to an existing workbook with optional default headers.',
    props: {
        workbook_id: excelCommon.workbook_id,
        name: Property.ShortText({
            displayName: "Worksheet Name",
            description: "The name for the new worksheet. If not provided, a default name like 'Sheet1' will be assigned.",
            required: false
        }),
        headers: Property.Array({
            displayName: "Headers",
            description: "Optional: A list of headers to add to the first row. A table will be created from these headers.",
            required: false,
        })
    },
    async run(context) {
        const { workbook_id, name, headers } = context.propsValue;
        const { access_token } = context.auth;


        const createWorksheetResponse = await httpClient.sendRequest<CreateWorksheetResponse>({
            method: HttpMethod.POST,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/add`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
            body: {
                ...(name ? { name } : {}),
            }
        });

        const newWorksheetName = createWorksheetResponse.body.name;


        if (headers && Array.isArray(headers) && headers.length > 0) {
            const headersArray = headers as string[];


            const endColumn = excelCommon.numberToColumnName(headersArray.length);
            const address = `A1:${endColumn}1`;


            await httpClient.sendRequest({
                method: HttpMethod.PATCH,
                url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${newWorksheetName}/range(address='${address}')`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: access_token,
                },
                body: {
                    values: [headersArray], 
                },
            });


            const createTableResponse = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${newWorksheetName}/tables/add`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: access_token,
                },
                body: {
                    address: address,
                    hasHeaders: true,
                },
            });

            
            return createTableResponse.body;
        }

        
        return createWorksheetResponse.body;
    }
});