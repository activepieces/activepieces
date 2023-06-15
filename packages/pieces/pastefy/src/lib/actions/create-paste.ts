import { Property, createAction } from "@activepieces/pieces-framework";
import { makeClient, pastefyCommon } from "../common";

export default createAction({
    name: 'create_paste',
    displayName: 'Create Paste',
    description: 'Creates a new paste',
    props: {
        authentication: pastefyCommon.authentication(),
        content: Property.LongText({
            displayName: 'Content',
            required: true
        }),
        title: Property.ShortText({
            displayName: 'Title',
            required: false
        }),
        folder_id: pastefyCommon.folder_id(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        
    }
})