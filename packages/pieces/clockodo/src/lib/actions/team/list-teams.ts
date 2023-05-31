import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'list_teams',
    displayName: 'Get Teams',
    description: 'Fetches teams from clockodo',
    props: {
        authentication: clockodoCommon.authentication
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.listTeams()
        return {
            teams: res.teams
        }
    }
})