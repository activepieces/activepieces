import { createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'get_playback_state',
    displayName: 'Get Playback State',
    description: 'Returns the current playback state of the player',
    props: {
        authentication: spotifyCommon.authentication
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.getPlaybackState()
        return res
    }
})