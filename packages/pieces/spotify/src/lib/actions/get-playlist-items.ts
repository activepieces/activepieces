import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'get_playlist_items',
    displayName: 'Get Playlist Items',
    description: 'Retrieves the list of items in the playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: spotifyCommon.playlist_id(true),
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
            description: 'Fetches all items in a single request',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        if(context.propsValue.all) {
            const items = await client.getAllPlaylistItems(context.propsValue.playlist_id as string)
            return { total: items.length, items }
        }
        return await client.getPlaylistItems(context.propsValue.playlist_id as string, {
            limit: context.propsValue.limit,
            offset: context.propsValue.offset
        })
    }
})