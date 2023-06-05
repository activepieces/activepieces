import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'list_users',
    displayName: 'Get Users',
    description: 'Fetches users from clockodo',
    props: {
        authentication: clockodoCommon.authentication
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.listUsers()
        return {
            users: res.users
        }
    }
})