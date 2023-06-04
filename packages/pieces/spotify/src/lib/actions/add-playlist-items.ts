import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'add_playlist_items',
    displayName: 'Add items to playlist',
    description: 'Adds tracks or episodes to the playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: spotifyCommon.playlist_id(true),
        items: Property.Array({
            displayName: 'Items',
            description: "URI's of the items to add",
            required: true
        }),
        position: Property.Number({
            displayName: 'Position',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        await client.addItemsToPlaylist(context.propsValue.playlist_id as string, {
            uris: context.propsValue.items as string[],
            position: context.propsValue.position
        })
    }
})