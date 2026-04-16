import { createAction, Property } from '@activepieces/pieces-framework'
import { clockodoAuth } from '../../auth'
import { makeClient } from '../../common'

export default createAction({
    auth: clockodoAuth,
    name: 'get_absence',
    displayName: 'Get Absence',
    description: 'Retrieves a single absence from clockodo',
    props: {
        absence_id: Property.Number({
            displayName: 'Absence ID',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const client = makeClient(auth.props)
        const res = await client.getAbsence(propsValue.absence_id)
        return res.absence
    },
})
