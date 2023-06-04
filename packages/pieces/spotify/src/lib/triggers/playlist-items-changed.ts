import { createTrigger, Property, StoreScope, TriggerStrategy } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { createHash } from 'crypto'

export default createTrigger({
    name: 'playlist_items_changed',
    displayName: 'Playlist Items Changed',
    description: 'Triggers when the items of a playlist change',
    type: TriggerStrategy.POLLING,
    props: {
        authentication: spotifyCommon.authentication,
        playlist_id: Property.ShortText({
            displayName: 'Playlist ID',
            required: true
        })
    },
    sampleData: {},
    onEnable: async (context) => {
        context.setSchedule({
            cronExpression: '* * * * *'
        })
        const client = makeClient(context.propsValue)
        const items = await client.getAllPlaylistItems(context.propsValue.playlist_id)
        const hash = createHash('md5').update(items.map(item => item.track.id).join(',')).digest('hex')
        await context.store.put('playlist_changed_trigger_hash', hash, StoreScope.FLOW)
    },
    onDisable: async (context) => {
        await context.store.delete('playlist_changed_trigger_hash', StoreScope.FLOW)
    },
    run: async (context) => {
        const oldHash = await context.store.get('playlist_changed_trigger_hash', StoreScope.FLOW)
        const client = makeClient(context.propsValue)
        const items = await client.getAllPlaylistItems(context.propsValue.playlist_id)
        const newHash = createHash('md5').update(items.map(item => item.track.id).join(',')).digest('hex')
        if(oldHash != newHash) {
            await context.store.put('playlist_changed_trigger_hash', newHash, StoreScope.FLOW)
            return [{ total: items.length, items }]
        }
        return []
    },
    test: async (context) => {
        const client = makeClient(context.propsValue)
        const items = await client.getAllPlaylistItems(context.propsValue.playlist_id)
        return [ { total: items.length, items } ]
    }
})