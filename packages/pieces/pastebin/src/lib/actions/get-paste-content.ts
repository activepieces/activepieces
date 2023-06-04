import { Property, createAction } from "@activepieces/pieces-framework";
import { makeClient, pastebinCommon } from "../common";

export default createAction({
    name: 'get_paste_content',
    displayName: 'Get Paste Content',
    description: 'Retrieves the content of a paste',
    props: {
        authentication: pastebinCommon.authentication(true),
        paste_id: Property.ShortText({
            displayName: 'Paste ID',
            required: true
        })
    },
    async run(context) {
        const client = await makeClient(context.propsValue)
        const content = await client.getPasteContent(context.propsValue.paste_id)
        return {
            content
        }
    }
})