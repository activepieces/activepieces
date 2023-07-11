import { Property, createAction } from "@activepieces/pieces-framework";
import { makeClient, weclappCommon } from "../../common";

export default createAction({
    auth: weclappCommon.auth,
    name: 'update_entity',
    displayName: 'Update Entity',
    description: 'Updates an entity by id',
    props: {
        entity_type: weclappCommon.entityType(),
        entity_id: weclappCommon.entityId(),
        body: Property.Object({
            displayName: 'Body',
            required: true
        })
    },
    async run(ctx) {
        const client = makeClient(ctx.auth)
        const entity = await client.update(ctx.propsValue.entity_type as string, ctx.propsValue.entity_id as string, ctx.propsValue.body)
        return entity
    }
})