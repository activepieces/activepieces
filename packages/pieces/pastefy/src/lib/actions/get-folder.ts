import { createAction } from "@activepieces/pieces-framework";
import { makeClient, pastefyCommon } from "../common";

export default createAction({
    name: 'get_folder',
    displayName: 'Get Folder',
    description: 'Retrieves information about a folder',
    props: {
        authentication: pastefyCommon.authentication(),
        folder_id: pastefyCommon.folder_id(true)
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const folder = await client.getFolder(context.propsValue.folder_id as string)
        return folder
    }
})