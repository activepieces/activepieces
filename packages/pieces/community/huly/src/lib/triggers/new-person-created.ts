import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyPerson, HulyChannel } from '../common/types';
import { SortingOrder, DocumentQuery, Timestamp, Ref } from '@hcengineering/core';
import contact, { Contact, Channel, ChannelProvider, ContactsTab } from '@hcengineering/contact';
import { Space } from '@hcengineering/core';

interface PersonWithSuggestion extends HulyPerson {
  suggestion: string;
}

function mapChannelType(provider: Ref<ChannelProvider> | undefined): 'email' | 'phone' | 'linkedin' | 'telegram' | 'other' {
  if (!provider) return 'other';

  const providerString = String(provider).toLowerCase();

  if (providerString.includes('email')) return 'email';
  if (providerString.includes('phone')) return 'phone';
  if (providerString.includes('linkedin')) return 'linkedin';
  if (providerString.includes('telegram')) return 'telegram';

  return 'other';
}

export const newPersonCreated = createTrigger({
  auth: hulyAuth,
  name: 'new_person_created',
  displayName: 'New Person Created',
  description: 'Triggers when a new person (contact) is created in Huly',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'Space to monitor for new people (leave empty to monitor all spaces)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const authConfig = auth as HulyAuthConfig;
          const client = await createHulyClient(authConfig);

          const spaces = await client.findAll(
            contact.class.ContactsTab,
            {},
            { sort: { index: SortingOrder.Ascending } }
          );

          await client.close();

          const options = spaces.map((space: ContactsTab) => ({
            label: String(space.label) || 'Unnamed Space',
            value: String(space._id),
          }));

          options.unshift({ label: 'All Spaces', value: '' });

          return { options };
        } catch (error) {
          return {
            options: [
              { label: 'All Spaces', value: '' },
              { label: 'Error loading spaces', value: 'error' }
            ],
          };
        }
      },
    }),
  },
  sampleData: {
    _id: 'person_123',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    channels: [
      { type: 'email', value: 'john@example.com' },
      { type: 'phone', value: '+1234567890' },
    ],
    suggestion: 'Consider adding more contact channels like LinkedIn or Telegram for better communication.',
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const lastCheckTime = await context.store.get('lastCheckTime');
    if (!lastCheckTime) {
      await context.store.put('lastCheckTime', Date.now());
    }
  },

  async onDisable(context) {
    await context.store.delete('lastCheckTime');
  },

  async test(context) {
    const auth = context.auth as HulyAuthConfig;
    const { space } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Contact> = {};

      if (space) {
        query.space = space as Ref<Space>;
      }

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: sevenDaysAgo as Timestamp };

      const results = await client.findAll(
        contact.class.Contact,
        query,
        {
          limit: 5,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const people: PersonWithSuggestion[] = [];

      for (const person of results) {
        let channels: HulyChannel[] = [];
        try {
          const personChannels = await client.findAll(
            contact.class.Channel,
            { attachedTo: person._id },
            { sort: { modifiedOn: SortingOrder.Descending } }
          );

          channels = personChannels.map((channel: Channel) => ({
            type: mapChannelType(channel.provider),
            value: channel.value || '',
          }));
        } catch (error) {
          console.warn(`Failed to fetch channels for person ${person._id}:`, error);
          channels = [];
        }

        const email = channels.find(c => c.type === 'email')?.value;

        people.push({
          _id: person._id,
          name: person.name || 'Unknown Contact',
          email: email,
          avatarUrl: person.avatar || undefined,
          channels: channels,
          suggestion: 'Consider adding more contact channels like LinkedIn or Telegram for better communication.',
        });
      }

      await client.close();

      return people.length > 0 ? people : [
        {
          _id: 'person_test',
          name: 'Test Person',
          email: 'test@example.com',
          avatarUrl: undefined,
          channels: [{ type: 'email', value: 'test@example.com' }],
          suggestion: 'Consider adding more contact channels like LinkedIn or Telegram for better communication.',
        }
      ];
    } catch (error) {
      console.error('Error in newPersonCreated test:', error);
      return [
        {
          _id: 'person_sample',
          name: 'Sample Person',
          email: 'sample@example.com',
          avatarUrl: undefined,
          channels: [{ type: 'email', value: 'sample@example.com' }],
          suggestion: 'Consider adding more contact channels like LinkedIn or Telegram for better communication.',
        }
      ];
    }
  },

  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { space } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Contact> = {};

      if (space) {
        query.space = space as Ref<Space>;
      }

      const lastCheckTime = await context.store.get('lastCheckTime') || Date.now() - (24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: lastCheckTime as Timestamp };

      const results = await client.findAll(
        contact.class.Contact,
        query,
        {
          limit: 50,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const people: PersonWithSuggestion[] = [];

      for (const person of results) {
        let channels: HulyChannel[] = [];
        try {
          const personChannels = await client.findAll(
            contact.class.Channel,
            { attachedTo: person._id },
            { sort: { modifiedOn: SortingOrder.Descending } }
          );

          channels = personChannels.map((channel: Channel) => ({
            type: mapChannelType(channel.provider),
            value: channel.value || '',
          }));
        } catch (error) {
          console.warn(`Failed to fetch channels for person ${person._id}:`, error);
          channels = [];
        }

        const email = channels.find(c => c.type === 'email')?.value;

        people.push({
          _id: person._id,
          name: person.name || 'Unknown Contact',
          email: email,
          avatarUrl: person.avatar || undefined,
          channels: channels,
          suggestion: 'Consider adding more contact channels like LinkedIn or Telegram for better communication.',
        });
      }

      await client.close();

      await context.store.put('lastCheckTime', Date.now());

      return people;
    } catch (error) {
      console.error('Error in newPersonCreated trigger:', error);
      return [];
    }
  },
});
