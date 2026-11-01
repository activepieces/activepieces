import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { VboutClient } from './client';
import {
  ContactStatusValues,
  SocialMediaChannelValues,
  SocialMediaProfile,
} from './models';
import { vboutAuth } from '../auth';
export function makeClient(apiKey: string): VboutClient {
  return new VboutClient(apiKey);
}

export const vboutCommon = {
  baseUrl: 'https://api.vbout.com/1',
  listid: ({
    required,
    description,
  }: {
    required: boolean;
    description?: string;
  }) =>
    Property.Dropdown({
      auth: vboutAuth,
      displayName: 'Email List',
      description,
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth.secret_text);
        const res = await client.listEmailLists();
        const options = res.lists.items.map((list) => {
          return {
            label: list.name,
            value: list.id,
          };
        });
        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No email lists found. Create one in VBOUT first.',
          };
        }
        return {
          disabled: false,
          options: options,
        };
      },
    }),
  listFields: Property.DynamicProperties({
    auth: vboutAuth,
    displayName: 'List Fields',
    required: true,
    refreshers: ['listid'],
    props: async ({ auth, listid }) => {
      if (!auth || !listid) {
        return {};
      }
      const fields: DynamicPropsValue = {};
      const client = makeClient(auth.secret_text);
      const contactList = await client.getEmailList(
        listid as unknown as string
      );
      const contactListFields = contactList.response.data.list.fields;
      Object.keys(contactListFields).forEach((key) => {
        fields[key] = Property.ShortText({
          displayName: contactListFields[key],
          required: false,
        });
      });
      return fields;
    },
  }),
  contactStatus: ({
    required,
    width,
  }: {
    required: boolean;
    width?: 'half';
  }) =>
    Property.StaticDropdown({
      displayName: 'Contact Status',
      required: required,
      width,
      options: {
        disabled: false,
        options: [
          {
            label: 'Unconfirmed',
            value: ContactStatusValues.UNCONFIRMED,
          },
          {
            label: 'Active',
            value: ContactStatusValues.ACTIVE,
          },
          {
            label: 'Unsubscribed',
            value: ContactStatusValues.UNSUBSCRIBE,
          },
          {
            label: 'Bounced Email',
            value: ContactStatusValues.BOUNCED_EMAIL,
          },
        ],
      },
    }),
  socialMediaChannel: Property.StaticDropdown({
    displayName: 'Network',
    required: true,
    display: 'cards',
    options: {
      disabled: false,
      options: [
        {
          label: 'X (Twitter)',
          value: SocialMediaChannelValues.TWITTER,
          description: 'Your profiles',
        },
        {
          label: 'LinkedIn',
          value: SocialMediaChannelValues.LINKEDIN,
          description: 'Pages and profiles',
        },
        {
          label: 'Facebook',
          value: SocialMediaChannelValues.FACEBOOK,
          description: 'Pages you manage',
        },
      ],
    },
  }),
  socialMediaProfile: Property.Dropdown({
    auth: vboutAuth,
    displayName: 'Account',
    required: true,
    refreshers: ['channel'],
    options: async ({ auth, channel }) => {
      if (!auth || !channel) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Pick a network first.',
        };
      }
      const client = makeClient(auth.secret_text);
      const { channels } = await client.listSocialMediaChannels();
      let options: { label: string; value: string }[] = [];
      switch (channel as string) {
        case SocialMediaChannelValues.TWITTER: {
          options = [
            ...options,
            ...mapSocialMediaProfile(channels.Twitter?.profiles ?? []),
          ];
          break;
        }
        case SocialMediaChannelValues.FACEBOOK: {
          options = [
            ...options,
            ...mapSocialMediaProfile(channels.Facebook?.pages ?? []),
          ];
          break;
        }
        case SocialMediaChannelValues.LINKEDIN: {
          options = [
            ...options,
            ...mapSocialMediaProfile(channels.Linkedin?.companies ?? []),
            ...mapSocialMediaProfile(channels.Linkedin?.profiles ?? []),
          ];
          break;
        }
      }
      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No accounts found for this network.',
        };
      }
      return {
        disabled: false,
        options: options,
      };
    },
  }),
};

function mapSocialMediaProfile(
  profiles: SocialMediaProfile[]
): { label: string; value: string }[] {
  return profiles.map((profile) => {
    return {
      label: profile.name,
      value: profile.id,
    };
  });
}
