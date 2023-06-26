import { Property, createAction } from "@activepieces/pieces-framework";
import { makeClient, pastefyCommon } from "../common";

export default createAction({
    name: 'delete_paste',
    displayName: 'Delete Paste',
    description: 'Deletes a paste',
    props: {
        authentication: pastefyCommon.authentication(),
        paste_id: Property.ShortText({
            displayName: 'Paste ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.deletePaste(context.propsValue.paste_id)
        return res
    }
})