import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { groupIdDropdown, makeOktaRequest, oktaAuth, userIdDropdown } from '../common/common'

export const addUserToGroupAction = createAction({
    auth: oktaAuth,
    name: 'add_user_to_group',
    displayName: 'Add User to Group',
    description: 'Add a user to a specific Okta group',
    props: {
        userId: userIdDropdown(),
        groupId: groupIdDropdown,
    },
    async run(context) {
        const userId = context.propsValue.userId
        const groupId = context.propsValue.groupId

        const response = await makeOktaRequest(context.auth, `/groups/${groupId}/users/${userId}`, HttpMethod.PUT)

        return {
            success: true,
            userId,
            groupId,
            message: 'User added to group',
        }
    },
})
