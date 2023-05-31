import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_user',
    displayName: 'Get User',
    description: 'Retrieves a single user from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        user_id: clockodoCommon.user_id()
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.getUser(context.propsValue.user_id as number)
        return res.user
    }
})