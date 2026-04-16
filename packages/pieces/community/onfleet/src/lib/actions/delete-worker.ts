import { createAction } from '@activepieces/pieces-framework'
import Onfleet from '@onfleet/node-onfleet'
import { onfleetAuth } from '../..'
import { common } from '../common'

export const deleteWorker = createAction({
    auth: onfleetAuth,
    name: 'delete_worker',
    displayName: 'Delete Worker',
    description: 'Delete an existing worker',
    props: {
        worker: common.worker,
    },
    async run(context) {
        const onfleetApi = new Onfleet(context.auth.secret_text)

        return await onfleetApi.workers.deleteOne(context.propsValue.worker as string)
    },
})
