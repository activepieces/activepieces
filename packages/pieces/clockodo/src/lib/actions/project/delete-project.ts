import { clockodoCommon, makeClient } from "../../common";
import { clockodo } from "../../../";

clockodo.addAction({
    name: 'delete_project',
    displayName: 'Delete Project',
    description: 'Deletes a project in clockodo',
    props: {
        project_id: clockodoCommon.project_id(true, false, false)
    },
    async run({ auth , propsValue }) {
        const client = makeClient(auth);
        await client.deleteProject(propsValue.project_id as number)
    }
})
