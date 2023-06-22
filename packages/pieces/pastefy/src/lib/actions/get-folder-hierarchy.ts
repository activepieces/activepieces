import { createAction } from "@activepieces/pieces-framework";
import { makeClient, pastefyCommon } from "../common";

export default createAction({
    name: 'get_folder_hierarchy',
    displayName: 'Get Folder Hierarchy',
    description: 'Retrieves a hierarchy of all folders',
    props: {
        authentication: pastefyCommon.authentication(),
        parent_id: pastefyCommon.folder_id(false, 'Start Folder')
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const hierarchy = await client.getFolderHierarchy(context.propsValue.parent_id)
        return hierarchy
    }
})