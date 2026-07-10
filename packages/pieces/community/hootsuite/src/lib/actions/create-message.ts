import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hootsuiteAuth } from '../auth';
import { hootsuiteApiCall } from '../common';

export const createMessageAction = createAction({
  auth: hootsuiteAuth,
  name: 'create_message',
  displayName: 'Schedule Post',
  description: 'Schedules or immediately publishes a post to one or more social media profiles.',
  audience: 'both',
  aiMetadata: { description: 'Publishes a post to one or more connected Hootsuite social profiles, either immediately or scheduled for a future time depending on whether a scheduled time is provided (leave it empty to post now; a future time must be at least 5 minutes ahead and in UTC). Use to create and distribute social media content across networks. Not idempotent: each call creates a new post, so repeating it produces duplicate posts. Requires the target social profile IDs and the post text.', idempotent: false },
  props: {
    socialProfileIds: Property.MultiSelectDropdown({
      displayName: 'Social Profiles',
      description: 'Select the social media profiles to post to.',
      refreshers: [],
      required: true,
      auth: hootsuiteAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your Hootsuite account first' };
        }
        try {
          const response = await hootsuiteApiCall<SocialProfilesResponse>({
            auth,
            method: HttpMethod.GET,
            path: '/socialProfiles',
          });
          return {
            disabled: false,
            options: response.body.data.map((p) => ({
              label: `${p.socialNetworkUsername ?? p.id} (${p.type})`,
              value: p.id,
            })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load profiles. Check your connection.' };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Post Text',
      description: 'The text content of your post.',
      required: true,
    }),
    scheduledSendTime: Property.DateTime({
      displayName: 'Scheduled Time',
      description: 'When to publish the post (UTC, must be at least 5 minutes in the future). Leave empty to post immediately.',
      required: false,
    }),
    emailNotification: Property.Checkbox({
      displayName: 'Email Notification',
      description: 'Send an email notification when the post is published.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { socialProfileIds, text, scheduledSendTime, emailNotification } = context.propsValue;

    const body: Record<string, unknown> = {
      text,
      socialProfileIds,
      emailNotification,
    };
    if (scheduledSendTime) {
      body['scheduledSendTime'] = new Date(scheduledSendTime).toISOString();
    }

    const response = await hootsuiteApiCall<MessageResponse>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/messages',
      body,
    });

    const msg = response.body.data;
    return {
      id: msg.id,
      state: msg.state,
      scheduled_send_time: msg.scheduledSendTime ?? null,
      text: msg.text ?? text,
      social_profile_ids: (msg.socialProfileIds ?? socialProfileIds).join(', '),
      post_url: msg.postUrl ?? null,
      errors: msg.errors ?? [],
    };
  },
});

type SocialProfile = {
  id: string;
  type: string;
  socialNetworkUsername?: string;
};

type SocialProfilesResponse = {
  data: SocialProfile[];
};

type MessageResponse = {
  data: {
    id: string;
    state: string;
    text?: string;
    scheduledSendTime?: string;
    socialProfileIds?: string[];
    postUrl?: string;
    errors?: unknown[];
  };
};
