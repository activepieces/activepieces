import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { VboutClient } from './client';
import {
  ContactStatusValues,
  SocialMediaChannelValues,
  SocialMediaProfile,
} from './models';
import { vboutAuth } from '../..';
export function makeClient(apiKey: string): VboutClient {
  return new VboutClient(apiKey);
}

export const vboutCommon = {
  baseUrl: 'https://api.vbout.com/1',
  listid: (required = true) =>
    Property.Dropdown({
      auth: vboutAuth,
      displayName: 'List ID',
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
        return {
          disabled: false,
          options: res.lists.items.map((list) => {
            return {
              label: list.name,
              value: list.id,
            };
          }),
        };
      },
    }),
  listFields: Property.DynamicProperties({
    auth: vboutAuth,
    displayName: 'Fields',
    required: true,
    refreshers: ['listid'],
    props: async ({ auth, listid }) => {
      if (!auth || !listid) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account and select Email List.',
        };
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
  contactStatus: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Contact Status',
      required: required,
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
            label: 'Unsubscribe',
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
    displayName: 'Social Media Channel',
    required: true,
    options: {
      disabled: false,
      options: [
        {
          label: 'Twitter',
          value: SocialMediaChannelValues.TWITTER,
        },
        {
          label: 'LinkedIn',
          value: SocialMediaChannelValues.LINKEDIN,
        },
        {
          label: 'Facebook',
          value: SocialMediaChannelValues.FACEBOOK,
        },
      ],
    },
  }),
  socialMediaProfile: Property.Dropdown({
    auth: vboutAuth,
    displayName: 'Social Media Account',
    required: true,
    refreshers: ['channel'],
    options: async ({ auth, channel }) => {
      if (!auth || !channel) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Please connect your account and select social media channel.',
        };
      }
      const client = makeClient(auth.secret_text);
      const { channels } = await client.listSocialMediaChannels();
      let options: { label: string; value: string }[] = [];
      switch (channel as string) {
        case SocialMediaChannelValues.TWITTER: {
          options = [
            ...options,
            ...mapSocialMediaProfile(channels.Twitter.profiles),
          ];
          break;
        }
        case SocialMediaChannelValues.FACEBOOK: {
          options = [
            ...options,
            ...mapSocialMediaProfile(channels.Facebook.pages),
          ];
          break;
        }
        case SocialMediaChannelValues.LINKEDIN: {
          options = [
            ...options,
            ...mapSocialMediaProfile(channels.Linkedin.companies),
            ...mapSocialMediaProfile(channels.Linkedin.profiles),
          ];
          break;
        }
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
