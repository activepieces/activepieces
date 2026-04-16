import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { meetgeekaiAuth } from '../common/auth'
import { makeRequest } from '../common/client'
import { meetingIdDropdwon } from '../common/props'

export const getMeetingDetails = createAction({
    auth: meetgeekaiAuth,
    name: 'getMeetingDetails',
    displayName: 'Get Meeting Details',
    description: 'Retrieves meeting details including host, participants, timestamps, and source information',
    props: {
        meetingId: meetingIdDropdwon,
    },
    async run(context) {
        const { meetingId } = context.propsValue

        const response = await makeRequest(context.auth.secret_text, HttpMethod.GET, `/meetings/${meetingId}`)

        return response
    },
})
