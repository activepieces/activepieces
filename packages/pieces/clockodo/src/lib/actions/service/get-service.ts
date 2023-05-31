import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_service',
    displayName: 'Get Service',
    description: 'Retrieves a single service from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        service_id: clockodoCommon.service_id(true, null)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.getService(context.propsValue.service_id as number)
        return res.service
    }
})