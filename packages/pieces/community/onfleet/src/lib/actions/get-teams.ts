import { createAction } from '@activepieces/pieces-framework'
import Onfleet from '@onfleet/node-onfleet'
import { onfleetAuth } from '../..'
import { common } from '../common'

export const getTeams = createAction({
    auth: onfleetAuth,
    name: 'get_teams',
    displayName: 'Get Teams',
    description: 'Gets many existing team',
    props: {},
    async run(context) {
        const onfleetApi = new Onfleet(context.auth.secret_text)

        return await onfleetApi.teams.get()
    },
})
