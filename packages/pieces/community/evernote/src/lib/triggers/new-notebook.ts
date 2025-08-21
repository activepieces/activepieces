import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';

const polling: Polling<string, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    try {
      const response = await fetch('https://www.evernote.com/edam/notebook', {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notebooks = await response.json();
      
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
