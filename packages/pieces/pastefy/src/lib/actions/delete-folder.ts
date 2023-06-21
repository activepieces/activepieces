import { createAction } from "@activepieces/pieces-framework";
import { makeClient, pastefyCommon } from "../common";

export default createAction({
    name: 'delete_folder',
    displayName: 'Delete Folder',
    description: 'Deletes a folder',
    props: {
        authentication: pastefyCommon.authentication(),
        folder_id: pastefyCommon.folder_id(true)
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.deleteFolder(context.propsValue.folder_id as string)
        return res
    }
})