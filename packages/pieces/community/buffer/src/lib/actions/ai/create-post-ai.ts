import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { BUFFER_ENUMS, bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { postOutputSchema } from '../../common/output-schemas';

export const createPostAi = createAction({
  auth: bufferAuth,
  name: 'create_post_ai',
  classification: 'WRITE',
  displayName: 'Create a Post',
  description: 'Create, schedule or draft a post on one Buffer channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one post on one Buffer channel (Channel ID from List Channels). Share Mode: addToQueue (default, next free queue slot), shareNext, customScheduled (needs Scheduled For, a future ISO 8601 time with a timezone such as 2026-12-01T09:00:00Z; giving Scheduled For alone implies customScheduled), or shareNow, which publishes publicly at once, so use it only when the user clearly asked. Save as Draft = yes keeps it unpublished. Some services need Service Metadata: Facebook {"facebook":{"type":"post"}}, Instagram {"instagram":{"type":"post","shouldShareToFeed":true}} plus an image, Pinterest a board from Get a Channel, YouTube {"youtube":{"title":"...","categoryId":"22"}} (categoryId is a YouTube category ID such as 22 People & Blogs, 27 Education or 28 Science & Technology) and a video to publish. To post on several channels call it once per channel. Each call creates a new post, so do not retry after a success; on a timeout check List Posts first. Returns the saved post with its Post ID.',
    idempotent: false,
  },
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The channel to post to, from List Channels.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The body of the post. Optional only when an image is attached.',
      required: false,
    }),
    mode: Property.StaticDropdown<string, false>({
      displayName: 'Share Mode',
      description: 'addToQueue (default), shareNext, customScheduled or shareNow (publishes immediately).',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Add to Queue', value: 'addToQueue' },
          { label: 'Share Next', value: 'shareNext' },
          { label: 'Schedule for a Custom Time', value: 'customScheduled' },
          { label: 'Share Now (publishes immediately)', value: 'shareNow' },
        ],
      },
    }),
    dueAt: Property.ShortText({
      displayName: 'Scheduled For',
      description: 'Future publishing time in ISO 8601 with a timezone, e.g. 2026-12-01T09:00:00Z or 2026-12-01T11:00:00+02:00. Only with customScheduled. Any other format fails without creating a post.',
      required: false,
    }),
    schedulingType: Property.StaticDropdown<string, false>({
      displayName: 'Scheduling Type',
      description: 'automatic (default): Buffer publishes. notification: Buffer sends a reminder to publish manually from the mobile app (needed for Facebook groups and Instagram personal profiles).',
      required: false,
      defaultValue: 'automatic',
      options: {
        disabled: false,
        options: [
          { label: 'Automatic', value: 'automatic' },
          { label: 'Notification', value: 'notification' },
        ],
      },
    }),
    saveToDraft: bufferAiProps.yesNoDropdown({
      displayName: 'Save as Draft',
      description: 'yes to save the post as a draft that is not published. Default no.',
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public http(s) URLs of images to attach.',
      required: false,
    }),
    linkUrl: Property.ShortText({
      displayName: 'Link URL',
      description: 'A link to share. On Facebook, LinkedIn, Threads, Bluesky and Substack it becomes a link preview card when no images are attached; otherwise it is added to the end of the text.',
      required: false,
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'Tags to file the post under, from List Tags.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Service Metadata',
      description: 'Service-specific settings keyed by service, as in the Buffer API, e.g. {"facebook":{"type":"post"}}, {"linkedin":{"firstComment":"..."}} or {"youtube":{"title":"...","categoryId":"22"}}.',
      required: false,
    }),
    ideaId: Property.ShortText({
      displayName: 'Idea ID',
      description: 'The idea this post comes from, from List Ideas.',
      required: false,
    }),
  },
  outputSchema: postOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const accessToken = context.auth.secret_text;
    const channelId = bufferAiProps.requiredId({ value: p.channelId, label: 'Channel ID' });
    const text = bufferAiProps.textOf(p.text);
    const dueAt = bufferAiProps.isoDate({ value: p.dueAt, label: 'Scheduled For', future: true });
    const chosenMode = bufferAiProps.oneOf({ value: p.mode, allowed: BUFFER_ENUMS.SHARE_MODES, label: 'Share Mode' });
    const mode = chosenMode ?? (dueAt === undefined ? 'addToQueue' : 'customScheduled');
    if (mode === 'customScheduled' && dueAt === undefined) {
      throw new Error('Scheduled For is required when Share Mode is customScheduled. Nothing was created.');
    }
    if (mode !== 'customScheduled' && dueAt !== undefined) {
      throw new Error(`Scheduled For only works with Share Mode customScheduled, not ${mode}. Nothing was created.`);
    }
    const schedulingType = bufferAiProps.oneOf({ value: p.schedulingType, allowed: BUFFER_ENUMS.SCHEDULING_TYPES, label: 'Scheduling Type' }) ?? 'automatic';
    const images = bufferAiProps.urlList({ value: p.imageUrls, label: 'Image URL' });
    const linkText = bufferAiProps.textOf(p.linkUrl);
    const link = linkText === undefined ? undefined : bufferAiProps.urlList({ value: linkText, label: 'Link URL' })[0];
    const tagIds = bufferAiProps.idList({ value: p.tagIds, label: 'Tag IDs' });
    const metadata = bufferAiProps.jsonObject({ value: p.metadata, label: 'Service Metadata' });
    const ideaId = bufferAiProps.optionalId(p.ideaId);
    if (text === undefined && images.length === 0 && link === undefined) {
      throw new Error('Give the post a Text, an image or a link. Nothing was created.');
    }

    const service = link === undefined ? undefined : await serviceOf({ accessToken, channelId });
    const content = bufferAiProps.postContentFor({ service, text, images, link, metadata });
    const input: Record<string, unknown> = {
      channelId,
      mode,
      schedulingType,
      assets: content.assets,
    };
    if (content.text !== undefined) input['text'] = content.text;
    if (content.metadata !== undefined) input['metadata'] = content.metadata;
    if (dueAt !== undefined) input['dueAt'] = dueAt;
    if (bufferAiProps.yes(p.saveToDraft)) input['saveToDraft'] = true;
    if (tagIds !== undefined) input['tagIds'] = tagIds;
    if (ideaId !== undefined) input['ideaId'] = ideaId;

    const data = await bufferClient.graphql<{ createPost: PostPayload }>({
      accessToken,
      query: bufferQueries.CREATE_POST,
      variables: { input },
      operation: `create a post on channel ${channelId}`,
    });
    const result = data.createPost;
    if (result.post === undefined || result.post === null) {
      throw new Error(`Buffer did not create the post (${result.__typename ?? 'unknown result'}): ${result.message ?? 'no reason given'}`);
    }
    return result.post;
  },
});

async function serviceOf({ accessToken, channelId }: { accessToken: string; channelId: string }): Promise<string> {
  const data = await bufferClient.graphql<{ channel: { id: string; service: string } }>({
    accessToken,
    query: bufferQueries.CHANNEL_SERVICE,
    variables: { id: channelId },
    operation: `load channel ${channelId}`,
  });
  return data.channel.service;
}

type PostPayload = {
  __typename?: string;
  message?: string;
  post?: Record<string, unknown> | null;
};
