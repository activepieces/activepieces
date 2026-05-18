import {
  createTrigger,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { createHash } from 'crypto';

export default createTrigger({
  name: 'playlist_items_changed',
  displayName: 'Playlist Items Changed',
  description: 'Triggers when the items of a playlist change',
  auth: spotifyCommon.authentication,
  type: TriggerStrategy.POLLING,
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
  },
  sampleData: {},
  onEnable: async ({ store, auth, propsValue }) => {
    const client = makeClient({ auth });
    const items = await client.getAllPlaylistItems(
      propsValue.playlist_id as string
    );
    const hash = createHash('md5')
      .update(items.map((item) => item.track.id).join(','))
      .digest('hex');
    await store.put('playlist_changed_trigger_hash', hash, StoreScope.FLOW);
  },
  onDisable: async ({ store, auth, propsValue }) => {
    await store.delete('playlist_changed_trigger_hash', StoreScope.FLOW);
  },
  run: async ({ store, auth, propsValue }) => {
    const oldHash = await store.get(
      'playlist_changed_trigger_hash',
      StoreScope.FLOW
    );
    const client = makeClient({ auth });
    const items = await client.getAllPlaylistItems(
      propsValue.playlist_id as string
    );
    const newHash = createHash('md5')
      .update(items.map((item) => item.track.id).join(','))
      .digest('hex');
    if (oldHash != newHash) {
      await store.put(
        'playlist_changed_trigger_hash',
        newHash,
        StoreScope.FLOW
      );
      return [{ total: items.length, items }];
    }
    return [];
  },
  test: async ({ auth, propsValue }) => {
    const client = makeClient({ auth });
    const items = await client.getAllPlaylistItems(
      propsValue.playlist_id as string
    );
    return [{ total: items.length, items }];
  },
});
