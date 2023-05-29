import { Property, createAction } from "@activepieces/pieces-framework";
import { callSalesforceApi, salesforcesCommon } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { property } from "lodash";

export const updateContactById = createAction({
    name: 'update_contact_by_id',
    displayName: 'Update contact',
    description: 'Update contact by Id',
    sampleData: {
    },
    props: {
        authentication: salesforcesCommon.authentication,
        object: Property.Object({
            displayName: "Object",
            description: "Select mapped object",
            required: true,
        }),
        id: Property.ShortText({
            displayName: "Id",
            description: "Select the Id",
            required: true,
        })
    },
    async run(context) {
        const { authentication, object, id } = context.propsValue;
        const response = await callSalesforceApi(HttpMethod.PATCH, authentication, `/services/data/v58.0/sobjects/Account/${id}`, {
            ...object
        });
        return response;
    }
})