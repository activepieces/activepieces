import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { meetgeekaiAuth } from '../common/auth'
import { makeRequest } from '../common/client'
import { teamIdDropdown } from '../common/props'

export const getTeamMeetings = createAction({
    auth: meetgeekaiAuth,
    name: 'getTeamMeetings',
    displayName: 'Get Team Meetings',
    description: 'Retrieves paginated past meetings of a team',
    props: {
        teamId: teamIdDropdown,
    },
    async run(context) {
        const { teamId } = context.propsValue

        const url = `/teams/${teamId}/meetings`

        const response = await makeRequest(context.auth.secret_text, HttpMethod.GET, url)

        return response
    },
})
