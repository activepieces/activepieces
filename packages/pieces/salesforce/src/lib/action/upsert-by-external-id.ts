import { Property, createAction } from "@activepieces/pieces-framework";
import { callSalesforceApi, salesforcesCommon } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const upsertByExternalId = createAction({
    name: 'upsert_by_external_id',
    displayName: 'Batch Upsert (Advanced)',
    description: 'Batch upsert a record by external id',
    sampleData: {
    },
    props: {
        authentication: salesforcesCommon.authentication,
        object: salesforcesCommon.object,
        external_field: Property.ShortText({
            displayName: "External Field",
            description: "Select the External Field",
            required: true,
        }),
        records: Property.Json({
            displayName: "Records",
            description: "Select the Records",
            required: true,
            defaultValue: {
                "records": []
            }
        }),
    },
    async run(context) {
        const records = context.propsValue?.records?.records;
        if(!records){
            throw new Error("Expect records field inside json to be an array with records to upsert");
        }
        const { authentication, object, external_field } = context.propsValue;
        const response = await callSalesforceApi(HttpMethod.PATCH, authentication, `/services/data/v55.0/composite/sobjects/${object}/${external_field}`, {
            "allOrNone": false,
            ...context.propsValue.records
        });
        return response;
    }
})