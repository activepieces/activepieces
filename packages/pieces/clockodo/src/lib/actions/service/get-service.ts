import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_service',
    displayName: 'Get Service',
    description: 'Retrieves a single service from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        service_id: Property.Number({
            displayName: 'Service ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.getService(context.propsValue.service_id)
        return res.service
    }
})