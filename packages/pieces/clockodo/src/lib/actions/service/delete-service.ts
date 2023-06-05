import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_service',
    displayName: 'Delete Service',
    description: 'Deletes a service in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        service_id: clockodoCommon.service_id(true, false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        await client.deleteService(context.propsValue.service_id as number)
    }
})