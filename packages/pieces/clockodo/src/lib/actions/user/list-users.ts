import { makeClient } from "../../common";
import { clockodo } from "../../../";

clockodo.addAction({
    name: 'list_users',
    displayName: 'Get Users',
    description: 'Fetches users from clockodo',
    props: {
    },
    async run({ auth }) {
        const client = makeClient(auth);
        const res = await client.listUsers()
        return {
            users: res.users
        }
    }
})
