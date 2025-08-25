import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';

const polling: Polling<string, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    try {
      const { Client } = require('evernote');
      const client = new Client({ token: auth, sandbox: false });
      const noteStore = client.getNoteStore();
      const notebooks = await noteStore.listNotebooks();
      
      return (notebooks || []).map((notebook: any) => ({
        epochMilliSeconds: notebook.serviceCreated || Date.now(),
        data: notebook,
      }));
    } catch (error) {
      console.error('Error polling for new notebooks:', error);
      return [];
    }
  },
};

export const newNotebook = createTrigger({
  auth: evernoteAuth,
  name: 'newNotebook',
  displayName: 'New Notebook',
  description: 'Triggers when a new notebook is created in Evernote',
  props: {},
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
