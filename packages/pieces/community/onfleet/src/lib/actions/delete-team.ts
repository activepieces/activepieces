import { createAction } from '@activepieces/pieces-framework'
import Onfleet from '@onfleet/node-onfleet'
import { onfleetAuth } from '../..'
import { common } from '../common'

export const deleteTeam = createAction({
    auth: onfleetAuth,
    name: 'delete_team',
    displayName: 'Delete Team',
    description: 'Delete an existing team',
    props: {
        team: common.team,
    },
    async run(context) {
        const onfleetApi = new Onfleet(context.auth.secret_text)

        return await onfleetApi.teams.deleteOne(context.propsValue.team as string)
    },
})
