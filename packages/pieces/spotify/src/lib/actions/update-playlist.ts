import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'update_playlist',
    displayName: 'Update Playlist',
    description: 'Updates details of the playlist',
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: spotifyCommon.playlist_id(true),
        name: Property.ShortText({
            displayName: 'Name',
            required: false
        }),
        description: Property.ShortText({
            displayName: 'Description',
            required: false
        }),
        public: Property.Checkbox({
            displayName: 'Public',
            required: false
        }),
        collaborative: Property.Checkbox({
            displayName: 'Collaborative',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        await client.updatePlaylist(context.propsValue.playlist_id as string, {
            name: context.propsValue.name,
            description: context.propsValue.description,
            public: context.propsValue.public,
            collaborative: context.propsValue.collaborative
        })
    }
})