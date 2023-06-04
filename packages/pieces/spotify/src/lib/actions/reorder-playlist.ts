import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'reorder_playlist',
    displayName: 'Reorder playlist',
    description: 'Reorders items in the playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: Property.ShortText({
            displayName: 'Playlist ID',
            required: true
        }),
        from_position: Property.Number({
            displayName: 'From Position',
            required: true
        }),
        to_position: Property.Number({
            displayName: 'To Position',
            required: true
        }),
        amount: Property.Number({
            displayName: 'Amount of Items',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        await client.reorderPlaylist(context.propsValue.playlist_id, {
            range_start: context.propsValue.from_position,
            range_length: context.propsValue.amount,
            insert_before: context.propsValue.to_position
        })
    }
})