import { createAction } from "@activepieces/pieces-framework";
import { Client } from "../../common/Client";
import { auth } from "../../common/auth";

export const getClientList = createAction({
    name: "get-client-list",
    displayName: "Get Client List",
    description: "Find all Clients",
    props: {
        authentication: auth,
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        
        const client = new Client(hostUrl, appKey, appToken);

        return await client.getClientList();

    },
});