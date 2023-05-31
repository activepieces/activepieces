import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_project',
    displayName: 'Delete Project',
    description: 'Deletes a project in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        project_id: clockodoCommon.project_id(true, false, false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        await client.deleteProject(context.propsValue.project_id as number)
    }
})