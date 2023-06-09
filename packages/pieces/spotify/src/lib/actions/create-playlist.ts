import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'create_playlist',
    displayName: 'Create Playlist',
    description: 'Creates a new playlist for the current user',
    props: {
        authentication: spotifyCommon.authentication,
        name: Property.ShortText({
            displayName: 'Name',
            required: true
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
        const user = await client.getCurrentUser()
        const res = await client.createPlaylist(user.id, {
            name: context.propsValue.name,
            description: context.propsValue.description,
            public: context.propsValue.public,
            collaborative: context.propsValue.collaborative
        })
        return res
    }
})