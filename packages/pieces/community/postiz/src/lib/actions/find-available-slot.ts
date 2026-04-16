import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { postizApiCall, postizCommon } from '../common'
import { postizAuth } from '../common/auth'

export const findAvailableSlot = createAction({
    auth: postizAuth,
    name: 'find_available_slot',
    displayName: 'Find Available Slot',
    description: 'Find the next available posting time slot for a connected channel',
    props: {
        integration: postizCommon.integrationDropdown,
    },
    async run(context) {
        const auth = context.auth

        const response = await postizApiCall<{ date: string }>({
            auth,
            method: HttpMethod.GET,
            path: `/find-slot/${context.propsValue.integration}`,
        })

        return {
            next_available_date: response.body.date,
        }
    },
})
