import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'play',
    displayName: 'Play / Resume',
    description: 'Resumes or starts playback',
    props: {
        authentication: spotifyCommon.authentication,
        device_id: spotifyCommon.device_id(false),
        context_uri: Property.ShortText({
            displayName: 'Context URI',
            description: 'Spotify URI of the context to play (album, artist, playlist)',
            required: false
        }),
        tracks: Property.Array({
            displayName: 'Tracks',
            description: 'List of spotify track uris to play',
            required: false,
        }),
        position_ms: Property.Number({
            displayName: 'Position',
            description: 'Position in milliseconds',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.play({
            device_id: context.propsValue.device_id,
            context_uri: context.propsValue.context_uri,
            uris: context.propsValue.tracks as string[],
            position_ms: context.propsValue.position_ms
        })
        return res
    }
})