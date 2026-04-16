import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { groupIdDropdown, makeOktaRequest, oktaAuth, userIdDropdown } from '../common/common'

export const removeUserFromGroupAction = createAction({
    auth: oktaAuth,
    name: 'remove_user_from_group',
    displayName: 'Remove User from Group',
    description: 'Remove a user from an Okta group',
    props: {
        groupId: groupIdDropdown,
        userId: userIdDropdown(true),
    },
    async run(context) {
        const userId = context.propsValue.userId
        const groupId = context.propsValue.groupId

        const response = await makeOktaRequest(context.auth, `/groups/${groupId}/users/${userId}`, HttpMethod.DELETE)

        return {
            success: true,
            userId,
            groupId,
            message: 'User removed from group',
        }
    },
})
