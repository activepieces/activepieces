import { Property, createAction } from "@activepieces/pieces-framework";
import { callSalesforceApi, salesforcesCommon } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createNewObject = createAction({
    name: 'create_new_object',
    displayName: 'Create Object (Advanced)',
    description: 'Create new object',
    sampleData: {
    },
    props: {
        authentication: salesforcesCommon.authentication,
        object: salesforcesCommon.object,
        data: Property.Json({
            displayName: "Data",
            description: "Select mapped object",
            required: true,
            defaultValue: {
            }
        })
    },
    async run(context) {
        const { authentication, data, object} = context.propsValue;
        const response = await callSalesforceApi(HttpMethod.POST, authentication, `/services/data/v58.0/sobjects/${object}`, {
            ...data
        });
        return response;
    }
})