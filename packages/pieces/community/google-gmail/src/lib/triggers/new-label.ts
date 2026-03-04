import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { google } from 'googleapis';

/*
 * Store key used to keep track of labels that have already been seen. We rely on
 * this cached list instead of timestamps (Gmail labels do **not** expose a
 * creation date).
 */
const STORE_KEY = 'knownLabelIds';

export const newLabel = createTrigger({
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when the user creates a new label in Gmail',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 'Label_123',
    name: 'Important'
  },

  /*
   * When the trigger is first enabled we cache all existing label IDs so that
   * only labels created after this point will be emitted on subsequent polls.
   */
  async onEnable({ auth, store }) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.labels.list({ userId: 'me' });
    const currentIds = (res.data.labels ?? []).map(l => l.id as string);
    await store.put(STORE_KEY, currentIds);
  },

  /*
   * Nothing special on disable – we simply clear the cached list.
   */
  async onDisable({ store }) {
    await store.put(STORE_KEY, []);
  },

  /*
   * Poll Gmail for all labels, compare with the cached IDs, and emit only those
   * that have not been seen before. After emitting, update the cache so they
   * won’t be emitted again.
   */
  async run({ auth, store }) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.labels.list({ userId: 'me' });
    const allLabels = res.data.labels ?? [];

    const cached: string[] = (await store.get<string[]>(STORE_KEY)) ?? [];
    const unseen = allLabels.filter(l => l.id && !cached.includes(l.id));

    if (unseen.length) {
      await store.put(STORE_KEY, [...cached, ...unseen.map(l => l.id as string)]);
    }

    const now = Date.now();
    return unseen.map(l => ({
      epochMilliSeconds: now,
      data: l,
    }));
  }
});
