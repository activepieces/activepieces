import { Property, createAction } from "@activepieces/pieces-framework";
import { callSalesforceApi, salesforcesCommon } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { property } from "lodash";

export const createNewContact = createAction({
    name: 'create_new_contact',
    displayName: 'Create contact',
    description: 'Create new Contact',
    sampleData: {
    },
    props: {
        authentication: salesforcesCommon.authentication,
        object: Property.Object({
            displayName: "Object",
            description: "Select mapped object",
            required: true,
        })
    },
    async run(context) {
        const { authentication, object} = context.propsValue;
        const response = await callSalesforceApi(HttpMethod.POST, authentication, `/services/data/v58.0/sobjects/Account`, {
            ...object
        });
        return response;
    }
})