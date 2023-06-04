import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";
import { PlaylistItem } from "../common/models/playlist";

export default createAction({
    name: 'get_playlist_items',
    displayName: 'Get Playlist Items',
    description: 'Retrieves the list of items in the playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: Property.ShortText({
            displayName: 'Playlist ID',
            required: true
        }),
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
            const items = await client.getAllPlaylistItems(context.propsValue.playlist_id)
            return { total: items.length, items }
        }
        return await client.getPlaylistItems(context.propsValue.playlist_id, {
            limit: context.propsValue.limit,
            offset: context.propsValue.offset
        })
    }
})