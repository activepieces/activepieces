import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof memAuth>,
  { collection_id?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) =>
    memClient.pollNotes({
      apiKey: auth.secret_text,
      timestampField: 'updated_at',
      lastFetchEpochMS,
      collectionId: propsValue.collection_id ?? undefined,
    }),
};

export const updatedNoteTrigger = createTrigger({
  auth: memAuth,
  name: 'updated_note',
  displayName: 'Updated Note',
  description: 'Triggers when a note is created or updated in Mem. Each poll reads every page of changes since the last poll.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires each time a Mem note is created or updated after the trigger was enabled, optionally only notes in one collection. Polls the note list by updated_at and emits the note list item (id, title, snippet, collection IDs, timestamps); use Get Note for the full content. Each poll follows every page of changes since the last poll, so no note is skipped.',
  },
  props: {
    collection_id: memProps.collectionDropdown({
      displayName: 'Collection',
      description: 'Only watch notes in this collection. Leave empty to watch all notes.',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  outputSchema: memSchemas.noteTrigger,
  sampleData: {
    id: '5e29c8a2-c73b-476b-9311-e2579712d4b1',
    title: 'Sales Call with Acme Corp',
    snippet: 'Discussed pricing and next steps.',
    collection_ids: ['59508b41-8770-4855-aa37-302b1e09aee7'],
    audio_recording_ids: [],
    created_at: '2025-04-11T04:47:14.457Z',
    updated_at: '2025-04-11T05:02:10.120Z',
  },
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
