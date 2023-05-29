import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_user',
    displayName: 'Get User',
    description: 'Retrieves a single user from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        user_id: Property.Number({
            displayName: 'User ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.getUser(context.propsValue.user_id)
        return res.user
    }
})