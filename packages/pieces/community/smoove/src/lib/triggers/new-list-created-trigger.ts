import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smooveApiCall } from '../common/client';
import { smooveAuth } from '../common/auth';

const LAST_LIST_IDS_KEY = 'smoove-last-list-ids';

export const newListCreatedTrigger = createTrigger({
  auth: smooveAuth,
  name: 'new_list_created',
  displayName: 'New List Created',
  description: 'Triggers when a new mailing list is created in your Smoove account.',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new lists.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
  },

  async onEnable(context) {
    const response = await smooveApiCall<{ lists: SmooveList[] }>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/Lists',
    });

    const listIds = response.lists.map((list) => list.id);
    await context.store.put<string[]>(LAST_LIST_IDS_KEY, listIds);
    console.log(`Smoove New List Trigger initialized with ${listIds.length} lists`);
  },

  async onDisable() {
    console.log('Smoove New List Trigger disabled');
  },

  async run(context) {
    const previousIds = (await context.store.get<string[]>(LAST_LIST_IDS_KEY)) || [];

    const response = await smooveApiCall<{ lists: SmooveList[] }>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/Lists',
    });

    const allLists = response.lists || [];
    const currentIds = allLists.map((list) => list.id);

    await context.store.put<string[]>(LAST_LIST_IDS_KEY, currentIds);

    const newLists = allLists.filter((list) => !previousIds.includes(list.id));

    return newLists.map((list) => ({
      id: String(list.id),
      name: list.name,
      publicName: list.publicName,
      description: list.description,
      publicDescription: list.publicDescription,
      isPublic: list.permissions?.isPublic || false,
      allowsUsersToSubscribe: list.permissions?.allowsUsersToSubscribe || false,
      allowsUsersToUnsubscribe: list.permissions?.allowsUsersToUnsubscribe || false,
      isPortal: list.permissions?.isPortal || false,
      rawListData: list,
      triggerInfo: {
        detectedAt: new Date().toISOString(),
        source: 'smoove',
        type: 'new_list_created',
      },
    }));
  },

  async test(context) {
    const response = await smooveApiCall<{ lists: SmooveList[] }>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/Lists',
    });

    const list = response.lists?.[0];
    if (!list) throw new Error('No lists found to test with');

    return [
      {
        id: String(list.id),
        name: list.name,
        publicName: list.publicName,
        description: list.description,
        publicDescription: list.publicDescription,
        isPublic: list.permissions?.isPublic || false,
        allowsUsersToSubscribe: list.permissions?.allowsUsersToSubscribe || false,
        allowsUsersToUnsubscribe: list.permissions?.allowsUsersToUnsubscribe || false,
        isPortal: list.permissions?.isPortal || false,
        rawListData: list,
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'smoove',
          type: 'new_list_created',
        },
      },
    ];
  },

  sampleData: {
    id: '456',
    name: 'Weekly Newsletter',
    publicName: 'Public Weekly Newsletter',
    description: 'Internal description of the newsletter list',
    publicDescription: 'Subscribe to receive weekly updates',
    isPublic: true,
    allowsUsersToSubscribe: true,
    allowsUsersToUnsubscribe: true,
    isPortal: false,
    triggerInfo: {
      detectedAt: new Date().toISOString(),
      source: 'smoove',
      type: 'new_list_created',
    },
  },
});

interface SmooveList {
  id: string;
  name?: string;
  publicName?: string;
  description?: string;
  publicDescription?: string;
  permissions?: {
    isPublic?: boolean;
    allowsUsersToSubscribe?: boolean;
    allowsUsersToUnsubscribe?: boolean;
    isPortal?: boolean;
  };
  [key: string]: any;
}
