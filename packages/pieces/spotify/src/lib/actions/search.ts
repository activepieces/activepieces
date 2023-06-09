import { createAction, Property } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'search',
    displayName: 'Search',
    description: 'Searches for tracks, artists, albums, etc.',
    props: {
        authentication: spotifyCommon.authentication,
        search_text: Property.ShortText({
            displayName: 'Search Text',
            description: 'The word or phrase you are searching for',
            required: true
        }),
        types: Property.StaticMultiSelectDropdown({
            displayName: 'Object Types',
            required: true,
            options: {
                options: [
                    { label: 'Albums', value: '' },
                    { label: 'Artists', value: 'artist' },
                    { label: 'Playlists', value: 'playlist' },
                    { label: 'Tracks', value: 'track' }
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limit',
            required: false
        }),
        offset: Property.Number({
            displayName: 'Offset',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.search({
            q: context.propsValue.search_text,
            type: context.propsValue.types.join(','),
            limit: context.propsValue.limit,
            offset: context.propsValue.offset
        })
        const result = {
            tracks: res.tracks?.items,
            artists: res.artists?.items,
            albums: res.albums?.items,
            playlists: res.playlists?.items
        }
        return result
    }
})