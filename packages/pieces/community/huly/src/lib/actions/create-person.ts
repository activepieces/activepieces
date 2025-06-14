import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { McpCreateResult } from '../common/types';
import { generateId, Ref } from '@hcengineering/core';
import contact, { Person, AvatarType, ChannelProvider } from '@hcengineering/contact';

interface PersonCreationData {
  name: string;
  avatarType: AvatarType;
  city: string;
}

export const createPerson = createAction({
  auth: hulyAuth,
  name: 'create_person',
  displayName: 'Create Person',
  description: 'Create a new person record with an email communication channel',
  props: {
    name: Property.ShortText({
      displayName: 'Person Name',
      description: 'Full name of the person (e.g., "Doe,John" or "John Doe")',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Primary email address for communication',
      required: true,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City where the person is located (optional)',
      required: false,
    }),
    avatarType: Property.StaticDropdown({
      displayName: 'Avatar Type',
      description: 'Type of avatar for the person',
      required: false,
      defaultValue: 'color',
      options: {
        options: [
          { label: 'Color Avatar', value: 'color' },
          { label: 'Image Upload', value: 'image' },
          { label: 'Gravatar', value: 'gravatar' },
          { label: 'External URL', value: 'external' },
        ],
      },
    }),
    additionalChannels: Property.LongText({
      displayName: 'Additional Channels',
      description: 'JSON array of additional communication channels (optional). Format: [{"provider": "Phone", "value": "+1234567890"}]',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { name, email, city, avatarType = 'color', additionalChannels } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const personId = generateId<Person>();

      const avatarTypeMap: Record<string, AvatarType> = {
        color: AvatarType.COLOR,
        image: AvatarType.IMAGE,
        gravatar: AvatarType.GRAVATAR,
        external: AvatarType.EXTERNAL,
      };

      const personData: PersonCreationData = {
        name,
        avatarType: avatarTypeMap[avatarType] || AvatarType.COLOR,
        city: city || '',
      };

      await client.createDoc(
        contact.class.Person,
        contact.space.Contacts,
        personData,
        personId
      );

      await client.addCollection(
        contact.class.Channel,
        contact.space.Contacts,
        personId,
        contact.class.Person,
        'channels',
        {
          provider: contact.channelProvider.Email,
          value: email,
        }
      );

      let additionalChannelsCount = 0;
      if (additionalChannels) {
        try {
          const parsedChannels = JSON.parse(additionalChannels);
          if (Array.isArray(parsedChannels)) {
            for (const channel of parsedChannels) {
              if (channel.provider && channel.value) {
                const providerMap: Record<string, Ref<ChannelProvider>> = {
                  phone: contact.channelProvider.Phone,
                  linkedin: contact.channelProvider.LinkedIn,
                  twitter: contact.channelProvider.Twitter,
                  telegram: contact.channelProvider.Telegram,
                  github: contact.channelProvider.GitHub,
                  facebook: contact.channelProvider.Facebook,
                  homepage: contact.channelProvider.Homepage,
                  whatsapp: contact.channelProvider.Whatsapp,
                  skype: contact.channelProvider.Skype,
                };

                const provider = providerMap[channel.provider.toLowerCase()] ||
                               contact.channelProvider[channel.provider as keyof typeof contact.channelProvider];

                if (provider) {
                  await client.addCollection(
                    contact.class.Channel,
                    contact.space.Contacts,
                    personId,
                    contact.class.Person,
                    'channels',
                    {
                      provider,
                      value: channel.value,
                    }
                  );
                  additionalChannelsCount++;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to parse additional channels:', error);
        }
      }

      const createdPerson = await client.findOne(contact.class.Person, { _id: personId });

      await client.close();

      if (!createdPerson) {
        return {
          success: false,
          error: 'Person creation failed - could not retrieve created person',
        };
      }

      const message = additionalChannelsCount > 0
        ? `Person '${name}' created successfully with email '${email}' and ${additionalChannelsCount} additional channels`
        : `Person '${name}' created successfully with email '${email}'`;

      const result: McpCreateResult = {
        _id: personId as string,
        success: true,
        message,
        data: {
          name: createdPerson.name,
          email: email,
          city: city || null,
          avatarType: avatarType,
          additionalChannels: additionalChannelsCount,
        },
      };

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
