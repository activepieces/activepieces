import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'list_services',
    displayName: 'Get Services',
    description: 'Fetches services from clockodo',
    props: {
        authentication: clockodoCommon.authentication
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.listServices()
        return {
            services: res.services
        }
    }
})