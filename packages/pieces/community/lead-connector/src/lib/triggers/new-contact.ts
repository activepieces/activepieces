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
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) => {
    const currentValues =
      (await getContacts(auth, {
        startAfterId: lastItemId as string,
        sortOrder: 'asc',
      })) ?? [];

    return currentValues.map((contact) => {
      return {
        id: contact.id,
        data: contact,
      };
    });
  },
};

export const newContact = createTrigger({
  auth: leadConnectorAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Trigger when a new contact is added.',
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
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});
