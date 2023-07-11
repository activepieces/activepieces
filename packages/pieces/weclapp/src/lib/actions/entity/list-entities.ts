import { createAction } from "@activepieces/pieces-framework";
import { makeClient, weclappCommon } from "../../common";

export default createAction({
    auth: weclappCommon.auth,
    name: 'list_entities',
    displayName: 'List Entities',
    description: 'Lists entities',
    props: {
        entity_type: weclappCommon.entityType()
    },
    async run(ctx) {
        const client = makeClient(ctx.auth)
        const entities = await client.list(ctx.propsValue.entity_type as string)
        return entities
    }
})