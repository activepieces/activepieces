import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
  OAuth2PropertyValue,
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
      const params = new URLSearchParams({
        maxNotes: '50',
      });

      if (propsValue.notebook) {
        params.append('notebookGuid', propsValue.notebook);
      }
      if (propsValue.tag) {
        params.append('tagGuid', propsValue.tag);
      }

      const response = await fetch(`https://www.evernote.com/edam/note?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notes = await response.json();
      
      return (notes.notes || [])
        .filter((note: any) => note.tagGuids && note.tagGuids.length > 0)
        .map((note: any) => ({
          epochMilliSeconds: note.updated || Date.now(),
          data: note,
        }));
    } catch (error) {
      console.error('Error polling for notes with tags:', error);
      return [];
    }
  },
};

export const newTagAdded = createTrigger({
  auth: evernoteAuth,
  name: 'newTagAdded',
  displayName: 'New Tag Added to Note',
  description: 'Triggers when a tag is added to a note in Evernote',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth: (auth as OAuth2PropertyValue).access_token, propsValue, files });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth: (auth as OAuth2PropertyValue).access_token, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth: (auth as OAuth2PropertyValue).access_token, propsValue });
  },
  async run(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth: (auth as OAuth2PropertyValue).access_token, propsValue, files });
  },
});
