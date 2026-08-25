import { intercomAuth } from '../auth';
import { createAction } from "@activepieces/pieces-framework";
import { intercomClient } from "../common";

export const listAllTagsAction = createAction({
    auth:intercomAuth,
    name:'list-all-tags',
    displayName:'List Tags',
    description:'List all tags.',
    audience: 'both',
    aiMetadata: { description: 'List all tags defined in the Intercom workspace. Takes no input; read-only and repeatable. Use to discover tag IDs before tagging or untagging a conversation, contact, or company.', idempotent: true },
    props:{},
    async run(context){
        const client = intercomClient(context.auth);

        const response = await client.tags.list();

        return response;
    }

})