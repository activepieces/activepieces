import { createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'get_playlist_info',
    displayName: 'Get Playlist Info',
    description: 'Retrieves details of a playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: spotifyCommon.playlist_id(true)
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        return await client.getPlaylist(context.propsValue.playlist_id as string)
    }
})