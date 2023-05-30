import { Property, createAction } from "@activepieces/pieces-framework";
import { callSalesforceApi, salesforcesCommon } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const UpdateObjectById = createAction({
    name: 'update_object_by_id',
    displayName: 'Update Object (Advanced)',
    description: 'Update object by Id',
    sampleData: {
    },
    props: {
        authentication: salesforcesCommon.authentication,
        object: salesforcesCommon.object,
        id: Property.ShortText({
            displayName: "Id",
            description: "Select the Id",
            required: true,
        }),
        data: Property.Json({
            displayName: "Data",
            description: "Select mapped object",
            required: true,
            defaultValue: {

            }
        })
    },
    async run(context) {
        const { authentication, object, id, data } = context.propsValue;
        const response = await callSalesforceApi(HttpMethod.PATCH, authentication, `/services/data/v56.0/sobjects/${object}/${id}`, {
            ...data
        });
        return response;
    }
})