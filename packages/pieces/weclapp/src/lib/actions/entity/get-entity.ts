import { createAction } from "@activepieces/pieces-framework";
import { makeClient, weclappCommon } from "../../common";

export default createAction({
    auth: weclappCommon.auth,
    name: 'get_entity',
    displayName: 'Get Entity',
    description: 'Retrieves an entity by id',
    props: {
        entity_type: weclappCommon.entityType(),
        entity_id: weclappCommon.entityId()
    },
    async run(ctx) {
        const client = makeClient(ctx.auth)
        const entity = await client.getById(ctx.propsValue.entity_type as string, ctx.propsValue.entity_id as string)
        return entity
    }
})