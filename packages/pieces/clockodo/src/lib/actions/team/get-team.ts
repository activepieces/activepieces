import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_team',
    displayName: 'Get Team',
    description: 'Retrieves a single team from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        team_id: clockodoCommon.team_id()
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.getTeam(context.propsValue.team_id as number)
        return res.team
    }
})