import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_user',
    displayName: 'Delete User',
    description: 'Deletes a user in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        user_id: clockodoCommon.user_id(true, false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        await client.deleteUser(context.propsValue.user_id as number)
    }
})