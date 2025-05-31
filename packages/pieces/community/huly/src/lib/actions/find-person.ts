import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyPerson, McpSearchResult } from '../common/types';
import { SortingOrder, DocumentQuery, SortingQuery, Ref } from '@hcengineering/core';
import contact, { Person, Channel, ChannelProvider, AvatarType } from '@hcengineering/contact';
import crypto from 'crypto';

interface TransformedChannel {
  type: 'email' | 'phone' | 'linkedin' | 'telegram' | 'other';
  value: string;
}

function generateMD5Hash(input: string): string {
  return crypto.createHash('md5').update(input.toLowerCase().trim()).digest('hex');
}

function constructAvatarUrl(person: Person, email?: string, baseUrl?: string): string | undefined {
  if (!person.avatarType) {
    return undefined;
  }

  switch (person.avatarType) {
    case AvatarType.EXTERNAL:
      return person.avatarProps?.url || undefined;

    case AvatarType.GRAVATAR:
      if (email) {
        const emailHash = generateMD5Hash(email);
        return `https://www.gravatar.com/avatar/${emailHash}?s=200&d=identicon`;
      }
      return undefined;

    case AvatarType.IMAGE:
      if (person.avatar && baseUrl) {
        return `${baseUrl}/files/${person.avatar}`;
      }
      return undefined;

    case AvatarType.COLOR:
    default:
      return undefined;
  }
}

export const findPerson = createAction({
  auth: hulyAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Find people and their communication channels in the contact system',
  props: {
    nameSearch: Property.ShortText({
      displayName: 'Name Search',
      description: 'Search by person name (optional)',
      required: false,
    }),
    citySearch: Property.ShortText({
      displayName: 'City Search',
      description: 'Search by city (optional)',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results',
      required: false,
      defaultValue: 'name',
      options: {
        options: [
          { label: 'Name (A-Z)', value: 'name' },
          { label: 'City (A-Z)', value: 'city' },
          { label: 'Modified Date (Latest First)', value: 'modifiedOn' },
        ],
      },
    }),
    includeChannels: Property.Checkbox({
      displayName: 'Include Communication Channels',
      description: 'Fetch all communication channels for each person',
      required: false,
      defaultValue: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const {
      nameSearch,
      citySearch,
      sortBy = 'name',
      includeChannels = true,
      limit = 20
    } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Person> = {};

      if (nameSearch) {
        query.name = { $regex: nameSearch, $options: 'i' };
      }

      if (citySearch) {
        query.city = { $regex: citySearch, $options: 'i' };
      }

      const sortConfig: SortingQuery<Person> = {};
      switch (sortBy) {
        case 'name':
          sortConfig.name = SortingOrder.Ascending;
          break;
        case 'city':
          sortConfig.city = SortingOrder.Ascending;
          break;
        case 'modifiedOn':
          sortConfig.modifiedOn = SortingOrder.Descending;
          break;
        default:
          sortConfig.name = SortingOrder.Ascending;
      }

      const results = await client.findAll(
        contact.class.Person,
        query,
        {
          limit,
          sort: sortConfig
        }
      );

      const people: HulyPerson[] = [];

      for (const person of results) {
        let channels: TransformedChannel[] = [];
        let email: string | undefined;

        if (includeChannels) {
          try {
            const personChannels = await client.findAll(
              contact.class.Channel,
              {
                attachedTo: person._id,
                attachedToClass: person._class
              }
            );

            channels = personChannels.map((channel: Channel) => ({
              type: getChannelType(channel.provider),
              value: channel.value,
            }));

            email = personChannels.find((channel: Channel) =>
              channel.provider === contact.channelProvider.Email
            )?.value;

          } catch (error) {
            console.warn(`Failed to fetch channels for person ${person._id}:`, error);
            channels = [];
          }
        }

        const avatarUrl = constructAvatarUrl(person, email, auth.url);

        people.push({
          _id: person._id,
          name: person.name || 'Unknown',
          email: email,
          avatarUrl: avatarUrl,
          channels: channels,
        });
      }

      await client.close();

      const response: McpSearchResult<HulyPerson> = {
        items: people,
        total: results.length,
        hasMore: results.length === limit,
      };

      const channelNote = includeChannels ? ' with channels' : '';
      return {
        success: true,
        data: response,
        message: `Found ${people.length} people${channelNote}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

function getChannelType(provider: Ref<ChannelProvider>): 'email' | 'phone' | 'linkedin' | 'telegram' | 'other' {
  if (provider === contact.channelProvider.Email) return 'email';
  if (provider === contact.channelProvider.Phone) return 'phone';
  if (provider === contact.channelProvider.LinkedIn) return 'linkedin';
  if (provider === contact.channelProvider.Telegram) return 'telegram';
  return 'other';
}
