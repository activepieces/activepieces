import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_project',
    displayName: 'Delete Project',
    description: 'Deletes a project in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        project_id: Property.Number({
            displayName: 'Project ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        await client.deleteProject(context.propsValue.project_id)
    }
})