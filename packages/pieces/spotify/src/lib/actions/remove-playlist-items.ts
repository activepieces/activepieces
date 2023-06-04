import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'remove_playlist_items',
    displayName: 'Remove items from playlist',
    description: 'Removes tracks or episodes from the playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: Property.ShortText({
            displayName: 'Playlist ID',
            required: true
        }),
        items: Property.Array({
            displayName: 'Items',
            description: "URI's of the items to remove",
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        await client.removeItemsFromPlaylist(context.propsValue.playlist_id, {
            tracks: context.propsValue.items.map(uri => ({ uri: uri as string }))
        })
    }
})