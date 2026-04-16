import { createAction } from '@activepieces/pieces-framework'
import { clockodoAuth } from '../../auth'
import { clockodoCommon, makeClient } from '../../common'

export default createAction({
    auth: clockodoAuth,
    name: 'get_project',
    displayName: 'Get Project',
    description: 'Retrieves a single project from clockodo',
    props: {
        project_id: clockodoCommon.project_id(true, false, null),
    },
    async run({ auth, propsValue }) {
        const client = makeClient(auth.props)
        const res = await client.getProject(propsValue.project_id as number)
        return res.project
    },
})
