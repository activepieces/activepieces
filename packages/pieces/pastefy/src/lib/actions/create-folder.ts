import { Property, createAction } from "@activepieces/pieces-framework";
import { makeClient, pastefyCommon } from "../common";

export default createAction({
    name: 'create_folder',
    displayName: 'Create Folder',
    description: 'Creates a new folder',
    props: {
        authentication: pastefyCommon.authentication(),
        name: Property.ShortText({
            displayName: 'Name',
            required: true
        }),
        parent_id: pastefyCommon.folder_id(false, 'Parent Folder')
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.createFolder({
            name: context.propsValue.name as string,
            parent: context.propsValue.parent_id
        })
        return res.folder
    }
})