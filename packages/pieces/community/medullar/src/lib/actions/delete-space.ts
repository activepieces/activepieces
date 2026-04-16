import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { medullarAuth } from '../auth'
import { medullarCommon, medullarPropsCommon } from '../common'

export const deleteSpace = createAction({
    auth: medullarAuth,
    name: 'deleteSpace',
    displayName: 'Delete Space',
    description: 'Delete an existing Space.',
    props: {
        spaceId: medullarPropsCommon.spaceId,
    },
    async run(context) {
        await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${medullarCommon.aiUrl}/spaces/${context.propsValue.spaceId}/`,
            headers: {
                Authorization: `Bearer ${context.auth.secret_text}`,
            },
        })

        return { deleted: true, spaceId: context.propsValue.spaceId }
    },
})
