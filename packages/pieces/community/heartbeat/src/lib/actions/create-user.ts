import { propsValidation } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatUsers } from '../common/users';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const heartBeatCreateUser = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_user',
  classification: 'WRITE',
  displayName: 'Create User',
  description: 'Create a new user in a Heartbeat community',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a member in a Heartbeat community, assigning a role and optionally groups and profile fields (bio, social links, status). Use to onboard a new person; the email must be unique to the community. Not idempotent: a second call with the same email is rejected, and with the introduction-thread option on and a bio set it also posts an introduction thread.',
    idempotent: false,
  },
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
    role_id: heartbeatProps.roleDropdown,
    group_ids: heartbeatProps.groupsDropdown,
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
      description: "A link to the user's LinkedIn profile (full URL including https://)",
      required: false,
    }),
    twitter: Property.LongText({
      displayName: 'Twitter',
      description: "A link to the user's Twitter profile (full URL including https://)",
      required: false,
    }),
    instagram: Property.LongText({
      displayName: 'Instagram',
      description: "A link to the user's Instagram profile (full URL including https://)",
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: "A link to the user's website (full URL including https://)",
      required: false,
    }),
    create_introduction_thread: Property.Checkbox({
      displayName: 'Create introduction thread',
      description:
        'If true and a value for bio is provided, an introduction thread for the user will be created in the channel designated for introductions in your community settings.',
      required: false,
    }),
  },
  outputSchema: heartbeatOutputSchemas.createdUser,
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().check(z.email()),
      linkedin: z.optional(z.string().check(z.url())),
      twitter: z.optional(z.string().check(z.url())),
      instagram: z.optional(z.string().check(z.url())),
      website: z.optional(z.string().check(z.url())),
    });
    return heartbeatUsers.createUser({
      token: auth.secret_text,
      body: {
        name: propsValue.name,
        email: propsValue.email.trim(),
        roleID: heartbeatApi.uuid({ value: propsValue.role_id, label: 'Role' }),
        groupIDs: heartbeatApi.listOrUndefined(heartbeatApi.uuidList({ value: propsValue.group_ids, label: 'Groups' })),
        profilePicture: heartbeatApi.optionalText(propsValue.profile_picture),
        bio: heartbeatApi.optionalText(propsValue.bio),
        status: heartbeatApi.optionalText(propsValue.status),
        linkedin: heartbeatApi.optionalText(propsValue.linkedin),
        twitter: heartbeatApi.optionalText(propsValue.twitter),
        instagram: heartbeatApi.optionalText(propsValue.instagram),
        website: heartbeatApi.optionalText(propsValue.website),
        createIntroductionThread: propsValue.create_introduction_thread,
      },
    });
  },
});
