import { createAction } from '@activepieces/pieces-framework'
import { clockodoAuth } from '../../../'
import { makeClient } from '../../common'

export default createAction({
  auth: clockodoAuth,
  name: 'list_teams',
  displayName: 'Get Teams',
  description: 'Fetches teams from clockodo',
  props: {},
  async run({ auth }) {
    const client = makeClient(auth)
    const res = await client.listTeams()
    return {
      teams: res.teams,
    }
  },
})
