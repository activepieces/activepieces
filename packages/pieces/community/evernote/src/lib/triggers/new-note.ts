import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';
import { evernoteCommon } from '../common';

const props = {
  notebook: evernoteCommon.notebook,
  tag: evernoteCommon.tag,
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    try {
      const { Client } = require('evernote');
      const client = new Client({ token: auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const filter = new noteStore.constructor.NoteFilter();
      filter.maxNotes = 50;
      
      if (propsValue.notebook) {
        filter.notebookGuid = propsValue.notebook;
      }
      if (propsValue.tag) {
        filter.tagGuids = [propsValue.tag];
      }

      const notes = await noteStore.findNotes(filter, 0, 50);
      
      return (notes.notes || []).map((note: any) => ({
        epochMilliSeconds: note.created || Date.now(),
        data: note,
      }));
    } catch (error) {
      console.error('Error polling for new notes:', error);
      return [];
    }
  },
};

export const newNote = createTrigger({
  auth: evernoteAuth,
  name: 'newNote',
  displayName: 'New Note',
  description: 'Triggers when a new note is created in Evernote',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});
