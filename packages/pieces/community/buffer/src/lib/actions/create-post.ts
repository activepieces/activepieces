import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../common/auth';
import { bufferClient } from '../common/client';
import { bufferProps, bufferFetch } from '../common/props';
import { bufferQueries } from '../common/queries';
import { bufferAiProps, YOUTUBE_CATEGORIES } from '../common/ai-props';
import { createPostOutputSchema } from '../common/output-schemas';

export const createPost = createAction({
  auth: bufferAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description:
    'Create a post in Buffer and add it to the queue, share it next, share it now, or schedule it for a custom time. Each run also loads your channel list (one extra Buffer API request, counted against your plan limit; Free: 600 a day).',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one Buffer post per selected channel, with a share mode that controls timing. Each call creates new posts.',
    idempotent: false,
  },
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
      description:
        'A link to share. On Facebook, LinkedIn, Threads, Bluesky and Substack it becomes a link preview card when no images are attached; otherwise it is added to the end of the text.',
      required: false,
    }),
    youtubeTitle: Property.ShortText({
      displayName: 'YouTube Title',
      description: 'The video title. Required when a YouTube channel is selected; ignored for other channels.',
      required: false,
    }),
    youtubeCategoryId: Property.StaticDropdown({
      displayName: 'YouTube Category',
      description: 'The video category. Required when a YouTube channel is selected; ignored for other channels.',
      required: false,
      options: {
        disabled: false,
        options: YOUTUBE_CATEGORIES,
      },
    }),
  },
  outputSchema: createPostOutputSchema,
  async run(context) {
    const {
      organizationId,
      channelIds,
      text,
      mode,
      dueAt,
      schedulingType,
      saveToDraft,
      imageUrls,
      linkUrl,
      youtubeTitle,
      youtubeCategoryId,
    } = context.propsValue;

    if (mode === 'customScheduled' && !dueAt) {
      throw new Error(
        'Scheduled Time is required when Share Mode is "Schedule for Custom Time".',
      );
    }
    const images = bufferAiProps.cleanList(imageUrls);
    const link = bufferAiProps.textOf(linkUrl);
    const accessToken = context.auth.secret_text;
    const channels = await bufferFetch.fetchChannels({ accessToken, organizationId });
    const serviceById = new Map(channels.map((channel) => [channel.id, channel.service]));
    const youtube = youtubeMetadata({ title: youtubeTitle, categoryId: youtubeCategoryId });
    const youtubeChannelIds = (channelIds ?? []).filter((channelId) => serviceById.get(channelId) === 'youtube');
    if (youtubeChannelIds.length > 0 && youtube === undefined) {
      throw new Error(
        `YouTube Title and YouTube Category are required when a YouTube channel is selected (${youtubeChannelIds.join(', ')}). Nothing was created.`,
      );
    }

    const created: CreatePostResult[] = [];
    for (const channelId of channelIds ?? []) {
      const service = serviceById.get(channelId);
      const content = bufferAiProps.postContentFor({
        service,
        text,
        images,
        link,
        metadata: service === 'youtube' ? youtube : undefined,
      });
      const input: Record<string, unknown> = {
        channelId,
        text: content.text,
        mode,
        schedulingType,
        assets: content.assets,
      };
      if (content.metadata !== undefined) {
        input['metadata'] = content.metadata;
      }
      if (mode === 'customScheduled' && dueAt) {
        input['dueAt'] = dueAt;
      }
      if (saveToDraft) {
        input['saveToDraft'] = true;
      }

      let result: CreatePostResult;
      try {
        const data = await bufferClient.graphql<{ createPost: CreatePostResult }>({
          accessToken,
          query: bufferQueries.CREATE_POST_LEGACY,
          variables: { input },
          operation: `create the post for channel ${channelId}`,
        });
        result = data.createPost;
      } catch (error) {
        throw new Error(partialFailure({ created, reason: error instanceof Error ? error.message : String(error) }));
      }
      if (result.message || !result.post) {
        throw new Error(
          partialFailure({
            created,
            reason: `Buffer rejected the post for channel ${channelId}: ${result.message ?? `unexpected result ${result.__typename ?? ''}`}`,
          }),
        );
      }
      created.push(result);
    }

    return { posts: created };
  },
});

function youtubeMetadata({ title, categoryId }: { title: unknown; categoryId: unknown }): Record<string, unknown> | undefined {
  const cleanTitle = bufferAiProps.textOf(title);
  const cleanCategoryId = bufferAiProps.textOf(categoryId);
  if (cleanTitle === undefined || cleanCategoryId === undefined) {
    return undefined;
  }
  return { youtube: { title: cleanTitle, categoryId: cleanCategoryId } };
}

function partialFailure({ created, reason }: { created: CreatePostResult[]; reason: string }): string {
  if (created.length === 0) {
    return reason;
  }
  const ids = created
    .map((result) => `${result.post?.id ?? '?'} (channel ${result.post?.channelId ?? '?'})`)
    .join(', ');
  return `${withFullStop(reason)} These posts were already created before the failure, so running the step again would post them twice: ${ids}.`;
}

function withFullStop(reason: string): string {
  const trimmed = reason.trimEnd();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

type CreatePostResult = {
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
