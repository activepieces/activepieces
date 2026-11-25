import { createTrigger, isNil, Property, StoreScope, TriggerStrategy } from '@activepieces/pieces-framework';
import { createHash } from 'crypto';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyRequests } from '../common/requests';

export default createTrigger({
  auth: pastefyAuth,
  name: 'paste_changed',
  classification: 'READ',
  displayName: 'Paste Changed',
  description: 'Triggers when the content (or title) of the paste changes',
  aiMetadata: {
    description: 'Fires once when a specific paste (by ID) has new content since the last check, and also on title changes when Include Title is on. Returns the paste as stored (ciphertext for encrypted pastes).',
  },
  type: TriggerStrategy.POLLING,
  props: {
    paste_id: Property.ShortText({ displayName: 'Paste ID', required: true }),
    include_title: Property.Checkbox({ displayName: 'Include Title', required: false }),
  },
  sampleData: {
    exists: true,
    id: 'aB3dE5gH',
    content: 'console.log("hello");',
    title: 'hello.js',
    encrypted: false,
    folder: 'Fo1dEr2x',
    user_id: 'UsEr1234',
    visibility: 'UNLISTED',
    raw_url: 'https://pastefy.app/aB3dE5gH/raw',
    type: 'PASTE',
    created_at: '2026-10-26 15:20:00.0',
    tags: ['javascript'],
    starred: false,
    user: { id: 'UsEr1234', name: 'jane', display_name: 'Jane', avatar: 'https://pastefy.app/avatar.png' },
    decrypted: false,
  },
  outputSchema: pastefyOutputSchemas.paste,
  onEnable: async ({ auth, propsValue, store, isRepublish }) => {
    if (isRepublish && !isNil(await store.get(STORE_KEY, StoreScope.FLOW))) {
      return;
    }
    const paste = await pastefyRequests.getPaste({ auth, pasteId: propsValue.paste_id });
    await store.put(STORE_KEY, hashOf({ paste, includeTitle: propsValue.include_title === true }), StoreScope.FLOW);
  },
  onDisable: async ({ store, isRepublish }) => {
    if (isRepublish) {
      return;
    }
    await store.delete(STORE_KEY, StoreScope.FLOW);
  },
  run: async ({ auth, propsValue, store }) => {
    const oldHash = await store.get<string>(STORE_KEY, StoreScope.FLOW);
    const paste = await pastefyRequests.getPaste({ auth, pasteId: propsValue.paste_id });
    const newHash = hashOf({ paste, includeTitle: propsValue.include_title === true });
    if (oldHash === newHash) {
      return [];
    }
    if (oldHash === legacyHashOf({ paste, includeTitle: propsValue.include_title === true })) {
      await store.put(STORE_KEY, newHash, StoreScope.FLOW);
      return [];
    }
    await store.put(STORE_KEY, newHash, StoreScope.FLOW);
    return [paste];
  },
  test: async ({ auth, propsValue }) => {
    const paste = await pastefyRequests.getPaste({ auth, pasteId: propsValue.paste_id });
    return [paste];
  },
});

function hashOf({ paste, includeTitle }: { paste: Record<string, unknown>; includeTitle: boolean }): string {
  const parts = includeTitle ? [paste['content'] ?? null, paste['title'] ?? null] : [paste['content'] ?? null];
  return createHash('md5').update(JSON.stringify(parts)).digest('hex');
}

function legacyHashOf({ paste, includeTitle }: { paste: Record<string, unknown>; includeTitle: boolean }): string {
  const title = includeTitle ? String(paste['title']) : '';
  return createHash('md5').update(`${String(paste['content'])}${title}`).digest('hex');
}

const STORE_KEY = 'paste_changed_trigger_hash';
