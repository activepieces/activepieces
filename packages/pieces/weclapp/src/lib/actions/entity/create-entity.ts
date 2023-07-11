import { Property, createAction } from "@activepieces/pieces-framework";
import { makeClient, weclappCommon } from "../../common";

export default createAction({
    auth: weclappCommon.auth,
    name: 'create_entity',
    displayName: 'Create Entity',
    description: 'Creates an entity',
    props: {
        entity_type: weclappCommon.entityType(),
        body: Property.Object({
            displayName: 'Body',
            required: true
        })
    },
    async run(ctx) {
        const client = makeClient(ctx.auth)
        const entity = await client.create(ctx.propsValue.entity_type as string, ctx.propsValue.body)
        return entity
    }
})