import { intercomAuth } from "../../index";
import { createAction } from "@activepieces/pieces-framework";
import { intercomClient } from "../common";

export const listAllTagsAction = createAction({
    auth:intercomAuth,
    name:'list-all-tags',
    displayName:'List Tags',
    description:'List all tags.',
    props:{},
    async run(context){
        const client = intercomClient(context.auth);

        const response = await client.tags.list();

        return response;
    }

})