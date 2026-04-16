import { createAction } from '@activepieces/pieces-framework'
import Onfleet from '@onfleet/node-onfleet'
import { onfleetAuth } from '../..'
import { common } from '../common'

export const deleteAdmin = createAction({
    auth: onfleetAuth,
    name: 'delete_admin',
    displayName: 'Delete Administrator',
    description: 'Delete an existing administrator',
    props: {
        admin: common.admin,
    },
    async run(context) {
        const onfleetApi = new Onfleet(context.auth.secret_text)

        return await onfleetApi.administrators.deleteOne(context.propsValue.admin as string)
    },
})
