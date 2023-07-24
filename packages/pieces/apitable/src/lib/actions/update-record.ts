import { DynamicPropsValue, Property, createAction } from "@activepieces/pieces-framework";
import { APITableCommon } from "../common";
import { APITableAuth } from "../../index";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const apiTableUpdateRecord = createAction({
    auth: APITableAuth,
    name: 'apitable_update_record',
    displayName: 'Update APITable Record',
    description: 'updates a record in datasheet.',
    sampleData: {
        "code": 200,
        "success": true,
        "data": {
          "records": [
            {
              "recordId": "recwFSozTQON7",
              "createdAt": 1689774745000,
              "updatedAt": 1689775686000,
              "fields": {
                "Long text": "Do people really look at this?",
                "asdasd": "hmmm",
                "Options": [
                  "wow"
                ],
                "Title": "amazing"
              }
            }
          ]
        },
        "message": "SUCCESS"
    },
    props: {
        datasheet: APITableCommon.datasheet,
        recordId: Property.ShortText({
            displayName: 'Record ID',
            description: 'The ID of the record to update.',
            required: true
        }),
        fields: APITableCommon.fields,
    },
    async run(context) {
        const auth = context.auth;
        const datasheet = context.propsValue.datasheet;
        const recordId = context.propsValue.recordId;
        const apiTableUrl = auth.apiTableUrl;
        const dynamicFields: DynamicPropsValue = context.propsValue.fields;
        const fields: {
            [n: string]: string
        } = {};

        const props = Object.entries(dynamicFields);
        for (const [propertyKey, propertyValue] of props) {
            if (propertyValue) {
                fields[propertyKey] = propertyValue;
            }
        }

        const request: HttpRequest = {
            method: HttpMethod.PATCH,
            url: `${apiTableUrl.replace(/\/$/, "")}/fusion/v1/datasheets/${datasheet}/records`,
            headers: {
                "Authorization": "Bearer " + auth.token,
                "Content-Type": "application/json",
            },
            body: {
                records: [
                    {
                        recordId: recordId,
                        fields: {
                            ...fields,
                        }
                    }
                ]
            }
        };

        const res = await httpClient.sendRequest<any>(request);
        
        return res.body;
    },
})
