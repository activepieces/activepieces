import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  propsValidation,
} from '@activepieces/pieces-common';
import { heartbeatAuth } from '../..';
import { z } from 'zod';

export const heartBeatCreateUser = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_user',
  displayName: 'Create User',
  description: 'Create a new user in a Heartbeat community',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: "The user's full name",
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The user's email. Must be unique to the community",
      required: true,
    }),
    role_id: Property.Dropdown({
      displayName: 'Roles',
      description: 'The role the user should have',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a connection',
          };

        const response = await httpClient.sendRequest<
          {
            id: string;
            name: string;
          }[]
        >({
          method: HttpMethod.GET,
          url: `https://api.heartbeat.chat/v0/roles`,
          headers: {
            'content-type': 'application/json',
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          body: {},
        });

        if (response.status === 200) {
          return {
            options: response.body.map((role) => ({
              label: role.name,
              value: role.id,
            })),
            disabled: false,
          };
        }

        return {
          options: [],
          disabled: true,
          placeholder: 'Error loading roles.',
        };
      },
    }),
    group_ids: Property.MultiSelectDropdown({
      displayName: 'Groups',
      description:
        'A list of the ids of the groups that the user should belong to.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading groups',
          };

        const response = await httpClient.sendRequest<
          {
            id: string;
            name: string;
          }[]
        >({
          method: HttpMethod.GET,
          url: `https://api.heartbeat.chat/v0/groups`,
          headers: {
            'content-type': 'application/json',
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          body: {},
        });

        if (response.status === 200) {
          return {
            options: response.body.map((group) => ({
              label: group.name,
              value: group.id,
            })),
            disabled: false,
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading groups',
        };
      },
    }),
    profile_picture: Property.ShortText({
      displayName: 'Profile Picture',
      description:
        'A Data URI scheme in the JPG, GIF, or PNG format. Ensure you use the proper content type (image/jpeg, image/png, image/gif) that matches the image data being provided',
      required: false,
    }),
    bio: Property.ShortText({
      displayName: 'Bio',
      description: "The user's bio",
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: "The user's status",
      required: false,
    }),
    linkedin: Property.LongText({
      displayName: 'LinkedIn',
      description: "A link to the user's LinkedIn profile",
      required: false,
    }),
    twitter: Property.LongText({
      displayName: 'Twitter',
      description: "A link to the user's Twitter profile",
      required: false,
    }),
    instagram: Property.LongText({
      displayName: 'Instagram',
      description: "A link to the user's Instagram profile",
      required: false,
    }),
    create_introduction_thread: Property.Checkbox({
      displayName: 'Create introduction thread',
      description:
        'If true and a value for bio is provided, an introduction thread for the user will be created in the channel designated for introductions in your community settings.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().email(),
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(), 
      instagram: z.string().url().optional()
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.heartbeat.chat/v0/users`,
      headers: {
        'content-type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: {
        name: propsValue.name,
        email: propsValue.email,
        roleID: propsValue.role_id,
        groupIDs: propsValue.group_ids,
        profilePicture: propsValue.profile_picture,
        bio: propsValue.bio,
        status: propsValue.status,
        linkedin: propsValue.linkedin,
        twitter: propsValue.twitter,
        instagram: propsValue.instagram,
        createIntroductionThread: propsValue.create_introduction_thread,
      },
    });

    return response.body;
  },
});
