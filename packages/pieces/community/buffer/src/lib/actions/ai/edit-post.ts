import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { BUFFER_ENUMS, bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { postOutputSchema } from '../../common/output-schemas';

export const editPost = createAction({
  auth: bufferAuth,
  name: 'edit_post',
  classification: 'WRITE',
  displayName: 'Edit a Post',
  description: 'Change the text, time, media, tags or settings of a Buffer post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes an existing Buffer post (Post ID from List Posts; check its allowedActions has updatePost). Give only what should change; empty fields keep their current value. Buffer checks the edited post as a whole, so this action first reads the post and resends its current text (and its media when it has no text) and, on YouTube, its stored title, category and other YouTube settings, which lets a time-only or text-only edit pass. Fields you give win. Scheduled For (future ISO 8601 with a timezone) moves the post to that time. Share Mode reschedules the post even when unchanged, so give it only to move the post; shareNow publishes immediately. Image URLs replace all media; Clear Media = yes removes it. Service Metadata: a youtube object is merged over the stored YouTube settings; any other service object replaces the stored one, so include its required members (facebook type, instagram type and shouldShareToFeed). Link cards and other settings you leave out are kept. Save as Draft = yes moves the post back to drafts. Returns the saved post. Repeating an edit with a Share Mode moves the post again.',
    idempotent: false,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The post to change, from List Posts or Create a Post.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'New body text. Leave empty to keep the current text.',
      required: false,
    }),
    dueAt: Property.ShortText({
      displayName: 'Scheduled For',
      description: 'New future publishing time, ISO 8601 with a timezone, e.g. 2026-12-01T09:00:00Z. Implies Share Mode customScheduled.',
      required: false,
    }),
    mode: Property.StaticDropdown<string, false>({
      displayName: 'Share Mode',
      description: 'Leave empty to keep the post where it is. addToQueue, shareNext, customScheduled (needs Scheduled For) or shareNow (publishes immediately).',
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
    schedulingType: Property.StaticDropdown<string, false>({
      displayName: 'Scheduling Type',
      description: 'Leave empty to keep it. automatic or notification.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Automatic', value: 'automatic' },
          { label: 'Notification', value: 'notification' },
        ],
      },
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Replaces all media on the post with these images. Leave empty to keep the current media.',
      required: false,
    }),
    clearMedia: bufferAiProps.yesNoDropdown({
      displayName: 'Clear Media',
      description: 'yes to remove all media from the post. Default no.',
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'Replaces the post tags with these (IDs from List Tags). Leave empty to keep the tags.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Service Metadata',
      description: 'Service-specific settings keyed by service, e.g. {"linkedin":{"firstComment":"..."}} or {"youtube":{"title":"..."}}. A youtube object is merged over the stored YouTube settings; any other service object replaces the stored one.',
      required: false,
    }),
    saveToDraft: bufferAiProps.yesNoDropdown({
      displayName: 'Save as Draft',
      description: 'yes to move the post back to drafts. Default no (keep its status).',
    }),
  },
  outputSchema: postOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const id = bufferAiProps.requiredId({ value: p.postId, label: 'Post ID' });
    const text = bufferAiProps.textOf(p.text);
    const dueAt = bufferAiProps.isoDate({ value: p.dueAt, label: 'Scheduled For', future: true });
    const chosenMode = bufferAiProps.oneOf({ value: p.mode, allowed: BUFFER_ENUMS.SHARE_MODES, label: 'Share Mode' });
    const mode = chosenMode ?? (dueAt === undefined ? undefined : 'customScheduled');
    if (mode === 'customScheduled' && dueAt === undefined) {
      throw new Error('Scheduled For is required when Share Mode is customScheduled. Nothing was changed.');
    }
    if (mode !== undefined && mode !== 'customScheduled' && dueAt !== undefined) {
      throw new Error(`Scheduled For only works with Share Mode customScheduled, not ${mode}. Nothing was changed.`);
    }
    const schedulingType = bufferAiProps.oneOf({ value: p.schedulingType, allowed: BUFFER_ENUMS.SCHEDULING_TYPES, label: 'Scheduling Type' });
    const images = bufferAiProps.urlList({ value: p.imageUrls, label: 'Image URL' });
    const clearMedia = bufferAiProps.yes(p.clearMedia);
    if (clearMedia && images.length > 0) {
      throw new Error('Give either Image URLs or Clear Media = yes, not both. Nothing was changed.');
    }
    const tagIds = bufferAiProps.idList({ value: p.tagIds, label: 'Tag IDs' });
    const metadata = bufferAiProps.jsonObject({ value: p.metadata, label: 'Service Metadata' });
    const saveToDraft = bufferAiProps.yes(p.saveToDraft);

    const input: Record<string, unknown> = { id };
    if (text !== undefined) input['text'] = text;
    if (dueAt !== undefined) input['dueAt'] = dueAt;
    if (mode !== undefined) input['mode'] = mode;
    if (schedulingType !== undefined) input['schedulingType'] = schedulingType;
    if (images.length > 0) input['assets'] = images.map((url) => ({ image: { url } }));
    if (clearMedia) input['assets'] = [];
    if (tagIds !== undefined) input['tagIds'] = tagIds;
    if (metadata !== undefined) input['metadata'] = metadata;
    if (saveToDraft) input['saveToDraft'] = true;
    if (Object.keys(input).length === 1) {
      throw new Error('Give at least one field to change. Nothing was changed.');
    }

    const accessToken = context.auth.secret_text;
    const source = await bufferClient.graphql<{ post: StoredPost }>({
      accessToken,
      query: bufferQueries.POST_EDIT_SOURCE,
      variables: { id },
      operation: `load post ${id} before editing it`,
    });
    fillFromStored({ input, stored: source.post, metadata });

    const data = await bufferClient.graphql<{ editPost: PostPayload }>({
      accessToken,
      query: bufferQueries.EDIT_POST,
      variables: { input },
      operation: `edit post ${id}`,
    });
    const result = data.editPost;
    if (result.post === undefined || result.post === null) {
      throw new Error(`Buffer did not change post ${id} (${result.__typename ?? 'unknown result'}): ${result.message ?? 'no reason given'}`);
    }
    return result.post;
  },
});

function fillFromStored({ input, stored, metadata }: {
  input: Record<string, unknown>;
  stored: StoredPost;
  metadata: Record<string, unknown> | undefined;
}): void {
  const storedText = typeof stored.text === 'string' && stored.text.trim() !== '' ? stored.text : undefined;
  if (input['text'] === undefined && storedText !== undefined) {
    input['text'] = storedText;
  }
  if (input['text'] === undefined && input['assets'] === undefined) {
    const assets = assetInputsOf(stored.assets ?? []);
    if (assets !== undefined && assets.length > 0) {
      input['assets'] = assets;
    }
  }
  if (stored.channelService === 'youtube') {
    const callerYoutube = metadata?.['youtube'];
    const youtube = {
      ...youtubeInputOf(stored.metadata),
      ...(isRecord(callerYoutube) ? callerYoutube : {}),
    };
    if (Object.keys(youtube).length > 0) {
      input['metadata'] = { ...(metadata ?? {}), youtube };
    }
  }
}

function youtubeInputOf(metadata: StoredPost['metadata']): Record<string, unknown> {
  if (metadata === null || metadata === undefined || metadata.__typename !== 'YoutubePostMetadata') {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const key of YOUTUBE_SETTING_KEYS) {
    const value = metadata[key];
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  const categoryId = metadata.category?.categoryId;
  if (typeof categoryId === 'string' && categoryId !== '') {
    result['categoryId'] = categoryId;
  }
  return result;
}

function assetInputsOf(assets: StoredAsset[]): Record<string, unknown>[] | undefined {
  const inputs: Record<string, unknown>[] = [];
  for (const asset of assets) {
    if (typeof asset.source !== 'string' || asset.source === '') {
      return undefined;
    }
    if (asset.type === 'image') {
      const image: Record<string, unknown> = { url: asset.source };
      if (asset.thumbnail) image['thumbnailUrl'] = asset.thumbnail;
      const altText = asset.image?.altText;
      if (typeof altText === 'string' && altText !== '') image['metadata'] = { altText };
      inputs.push({ image });
    } else if (asset.type === 'video') {
      const video: Record<string, unknown> = { url: asset.source };
      const videoMetadata: Record<string, unknown> = {};
      if (typeof asset.video?.title === 'string') videoMetadata['title'] = asset.video.title;
      if (typeof asset.video?.thumbnailOffset === 'number') videoMetadata['thumbnailOffset'] = asset.video.thumbnailOffset;
      if (Object.keys(videoMetadata).length > 0) video['metadata'] = videoMetadata;
      inputs.push({ video });
    } else if (asset.type === 'document') {
      const title = asset.document?.title;
      if (typeof title !== 'string' || title === '' || !asset.thumbnail) {
        return undefined;
      }
      inputs.push({ document: { url: asset.source, title, thumbnailUrl: asset.thumbnail } });
    } else {
      return undefined;
    }
  }
  return inputs;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const YOUTUBE_SETTING_KEYS = ['title', 'privacy', 'license', 'madeForKids', 'notifySubscribers', 'embeddable', 'isAiGenerated'] as const;

type StoredAsset = {
  type?: string;
  source?: string;
  thumbnail?: string | null;
  image?: { altText?: string | null } | null;
  video?: { title?: string | null; thumbnailOffset?: number | null } | null;
  document?: { title?: string | null } | null;
};

type StoredPost = {
  id: string;
  text?: string | null;
  channelService?: string;
  assets?: StoredAsset[] | null;
  metadata?: ({
    __typename?: string;
    category?: { categoryId?: string | null } | null;
  } & Partial<Record<(typeof YOUTUBE_SETTING_KEYS)[number], unknown>>) | null;
};

type PostPayload = {
  __typename?: string;
  message?: string;
  post?: Record<string, unknown> | null;
};
