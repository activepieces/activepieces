import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_project',
    displayName: 'Get Project',
    description: 'Retrieves a single project from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        project_id: clockodoCommon.project_id(true, false, undefined)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.getProject(context.propsValue.project_id as number)
        return res.project
    }
})