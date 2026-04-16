import { createAction } from '@activepieces/pieces-framework'
import Onfleet from '@onfleet/node-onfleet'
import { onfleetAuth } from '../..'
import { common } from '../common'

export const getWorker = createAction({
    auth: onfleetAuth,
    name: 'get_worker',
    displayName: 'Get Worker',
    description: "Get an existing worker's details",
    props: {
        worker: common.worker,
    },
    async run(context) {
        const onfleetApi = new Onfleet(context.auth.secret_text)

        return await onfleetApi.workers.get(context.propsValue.worker as string)
    },
})
