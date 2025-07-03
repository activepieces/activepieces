import { OAuth2PropertyValue, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { leadConnectorAuth } from '../..';
import { getContacts } from '../common';

const polling: Polling<OAuth2PropertyValue, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const currentValues =
      (await getContacts(auth, {
        sortBy: 'date_updated',
        sortOrder: 'asc',
      })) ?? [];

    return currentValues.map((contact) => {
      return {
        epochMilliSeconds: new Date(contact.dateUpdated).getTime(),
        data: contact,
      };
    });
  },
};

export const contactUpdated = createTrigger({
  auth: leadConnectorAuth,
  name: 'contact_updated',
  displayName: 'Contact Created or Updated',
  description: 'Trigger when a contact is created or updated.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {},

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
