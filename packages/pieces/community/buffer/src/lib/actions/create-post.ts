import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../common/auth';
import { bufferClient } from '../common/client';
import { bufferProps } from '../common/props';

type CreatePostResponse = {
  createPost: {
    __typename?: string;
    message?: string;
    post?: {
      id: string;
      text?: string;
      status?: string;
      dueAt?: string;
      sentAt?: string;
      channelId?: string;
    };
  };
};

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          text
          status
          dueAt
          sentAt
          channelId
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export const createPost = createAction({
  auth: bufferAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description:
    'Queue, schedule or publish a post on one or more Buffer channels.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a social media post in Buffer for one or more channels, where the share mode controls timing: add to the channel queue, share next (skip the queue), share now, or schedule for a custom time. Choose it to draft or publish content to connected social accounts. A custom-scheduled post requires the scheduled time; posting to multiple channels creates a separate post per channel. Not idempotent — each call creates new posts.',
    idempotent: false,
  },
  props: {
    organizationId: bufferProps.organizationId(),
    channelIds: bufferProps.channelIds(true),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Posted as written to every channel you picked.',
      placeholder: 'Our spring collection is live!',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'When to Publish',
      required: true,
      defaultValue: 'addToQueue',
      options: {
        disabled: false,
        options: [
          {
            label: 'Add to Queue',
            value: 'addToQueue',
            description: 'Next open slot',
            icon: 'inbox',
          },
          {
            label: 'Share Next',
            value: 'shareNext',
            description: 'Top of queue',
            icon: 'sliders',
          },
          {
            label: 'Share Now',
            value: 'shareNow',
            description: 'Right away',
            icon: 'send',
          },
          {
            label: 'Schedule',
            value: 'customScheduled',
            description: 'At a set time',
            icon: 'calendar',
          },
        ],
      },
      display: 'cards',
    }),
    dueAt: Property.DateTime({
      displayName: 'Scheduled Time',
      description:
        'Used only with Schedule; times without an offset are read as UTC.',
      placeholder: '2026-12-01T09:00:00Z',
      required: false,
    }),
    schedulingType: Property.StaticDropdown({
      displayName: 'How to Publish',
      description:
        'Pick Notification for channels Buffer cannot post to directly.',
      required: true,
      defaultValue: 'automatic',
      options: {
        disabled: false,
        options: [
          {
            label: 'Automatic',
            value: 'automatic',
            description: 'Buffer posts it',
            icon: 'send',
          },
          {
            label: 'Notification',
            value: 'notification',
            description: 'Via mobile app',
            icon: 'user',
          },
        ],
      },
      display: 'cards',
    }),
    saveToDraft: Property.Checkbox({
      displayName: 'Save as Draft',
      description:
        'Keep the post as a draft in Buffer instead of publishing it.',
      required: false,
      defaultValue: false,
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public links to images to attach to the post.',
      required: false,
    }),
    linkUrl: Property.ShortText({
      displayName: 'Link URL',
      description: 'Shown on the post as a link preview.',
      placeholder: 'https://example.com/article',
      required: false,
    }),
  },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Post to',
      icon: 'users',
      props: ['organizationId', 'channelIds'],
    },
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'text',
      props: ['text', 'imageUrls', 'linkUrl'],
    },
    {
      key: 'publishing',
      display: 'section',
      label: 'Publishing',
      icon: 'calendar',
      props: ['mode', 'dueAt', 'schedulingType', 'saveToDraft'],
    },
  ],
  async run(context) {
    const {
      channelIds,
      text,
      mode,
      dueAt,
      schedulingType,
      saveToDraft,
      imageUrls,
      linkUrl,
    } = context.propsValue;

    if (mode === 'customScheduled' && !dueAt) {
      throw new Error(
        'Pick a Scheduled Time to schedule this post.',
      );
    }

    const assets: Array<Record<string, unknown>> = [];
    for (const url of imageUrls ?? []) {
      assets.push({ image: { url: url as string } });
    }
    if (linkUrl) {
      assets.push({ link: { url: linkUrl } });
    }

    const results: CreatePostResponse['createPost'][] = [];
    for (const channelId of channelIds ?? []) {
      const input: Record<string, unknown> = {
        channelId,
        text,
        mode,
        schedulingType,
        assets,
      };
      if (mode === 'customScheduled' && dueAt) {
        input['dueAt'] = dueAt;
      }
      if (saveToDraft) {
        input['saveToDraft'] = true;
      }

      const data = await bufferClient.graphql<CreatePostResponse>({
        accessToken: context.auth.secret_text,
        query: CREATE_POST_MUTATION,
        variables: { input },
      });

      if (data.createPost.message) {
        throw new Error(
          `Buffer rejected the post for channel ${channelId}: ${data.createPost.message}`,
        );
      }
      results.push(data.createPost);
    }

    return { posts: results };
  },
});
