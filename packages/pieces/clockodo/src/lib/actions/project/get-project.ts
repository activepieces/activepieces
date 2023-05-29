import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_project',
    displayName: 'Get Project',
    description: 'Retrieves a single project from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        project_id: Property.Number({
            displayName: 'Project ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.getProject(context.propsValue.project_id)
        return res.project
    }
})