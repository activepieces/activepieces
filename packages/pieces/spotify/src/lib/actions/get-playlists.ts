import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'get_playlists',
    displayName: 'Get Playlists',
    description: 'Retrieves the list of playlists that you created or followed',
    props: {
        authentication: spotifyCommon.authentication,
        offset: Property.Number({
            displayName: 'Limit',
            required: false
        }),
        limit: Property.Number({
            displayName: 'Limit',
            required: false
        }),
        all: Property.Checkbox({
            displayName: 'All',
            description: 'Fetches all playlists in a single request',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        if(context.propsValue.all) {
            const items = await client.getAllCurrentUserPlaylists()
            return { total: items.length, items }
        }
        return await client.getCurrentUserPlaylists({
            limit: context.propsValue.limit,
            offset: context.propsValue.offset
        })
    }
})