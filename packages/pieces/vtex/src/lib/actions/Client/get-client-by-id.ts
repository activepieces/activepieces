import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "../../common/Client";
import { auth } from "../../common/auth";

export const getClientById = createAction({
    name: "get-client-by-id",
    displayName: "Get Client By ID",
    description: "Find a Client by Id",
    props: {
        authentication: auth,
        clientId: Property.Number({
            displayName: "Client ID",
            description: "The Client ID",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const { clientId } = context.propsValue;

        const client = new Client(hostUrl, appKey, appToken);

        return await client.getClientById(clientId);

    },
});