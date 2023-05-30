import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_service',
    displayName: 'Delete Service',
    description: 'Deletes a service in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        service_id: Property.Number({
            displayName: 'Service ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        await client.deleteService(context.propsValue.service_id)
    }
})