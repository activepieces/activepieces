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
  displayName: 'Create Post',
  description:
    'Create a post in Buffer and add it to the queue, share it next, share it now, or schedule it for a custom time.',
  props: {
    organizationId: bufferProps.organizationId(),
    channelIds: bufferProps.channelIds(true),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content of the post.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Share Mode',
      description: 'When and how the post should be published.',
      required: true,
      defaultValue: 'addToQueue',
      options: {
        disabled: false,
        options: [
          { label: 'Add to Queue', value: 'addToQueue' },
          { label: 'Share Next (skip the queue)', value: 'shareNext' },
          { label: 'Share Now', value: 'shareNow' },
          { label: 'Schedule for Custom Time', value: 'customScheduled' },
        ],
      },
    }),
    dueAt: Property.DateTime({
      displayName: 'Scheduled Time',
      description:
        'When to publish the post. Required when Share Mode is "Schedule for Custom Time". ISO 8601 (UTC).',
      required: false,
    }),
    schedulingType: Property.StaticDropdown({
      displayName: 'Scheduling Type',
      description:
        'Use "Automatic" for channels Buffer can publish to directly. Use "Notification" for channels that require manual publishing via the Buffer mobile app (e.g. Instagram personal accounts).',
      required: true,
      defaultValue: 'automatic',
      options: {
        disabled: false,
        options: [
          { label: 'Automatic', value: 'automatic' },
          { label: 'Notification (manual publish)', value: 'notification' },
        ],
      },
    }),
    saveToDraft: Property.Checkbox({
      displayName: 'Save as Draft',
      description:
        'Save the post as a draft instead of scheduling it. Drafts are not published until explicitly scheduled.',
      required: false,
      defaultValue: false,
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public URLs of images to attach to the post.',
      required: false,
    }),
    linkUrl: Property.ShortText({
      displayName: 'Link URL',
      description: 'A link to attach to the post (used as a link preview).',
      required: false,
    }),
  },
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
        'Scheduled Time is required when Share Mode is "Schedule for Custom Time".',
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
