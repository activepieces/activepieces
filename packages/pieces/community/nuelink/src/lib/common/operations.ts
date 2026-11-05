import { HttpMethod } from '@activepieces/pieces-common';
import { NUELINK_LIMITS, nuelinkClient } from './client';
import { nuelinkInputs } from './inputs';
import { nuelinkTime } from './time';

export const nuelinkPosts = {
  create,
  update,
  remove,
  list,
  listPublished,
  upload,
};

async function create({ apiKey, brandId, collectionId, props, pollAllowed }: { apiKey: string; brandId: string; collectionId: string; props: Record<string, unknown>; pollAllowed: boolean }) {
  const publishMode = nuelinkInputs.oneOf({ value: props['publishMode'], label: 'Publish Mode', allowed: PUBLISH_MODES }) ?? 'DRAFT';
  const poll = pollAllowed
    ? nuelinkInputs.poll({
        question: props['pollQuestion'],
        options: props['pollOptions'],
        period: props['pollPeriod'],
        correctOptionIndex: props['pollCorrectOptionIndex'],
        explanation: props['pollExplanation'],
      })
    : undefined;
  const caption = poll === undefined ? nuelinkInputs.requiredText({ value: props['caption'], label: 'Caption', max: 3000 }) : nuelinkInputs.optionalText({ value: props['caption'], label: 'Caption', max: 3000 });
  if (pollAllowed && caption === undefined && poll === undefined) {
    throw new Error('Set a caption, a poll, or both.');
  }
  const title = nuelinkInputs.optionalText({ value: props['title'], label: 'Title', max: 255 });
  const alt = nuelinkInputs.optionalText({ value: props['alt'], label: 'Alt Text', max: 255 });
  const linkText = nuelinkInputs.optionalText({ value: props['link'], label: 'Link', max: 1000 });
  const link = linkText === undefined ? undefined : nuelinkInputs.httpUrl({ value: linkText, label: 'Link' });
  const media = nuelinkInputs.mediaItems({ value: props['media'] });
  const comment = firstComment({ text: props['firstComment'], delay: props['firstCommentDelaySeconds'] });
  const platforms = platformOptions({ props });
  const hasSchedule = nuelinkInputs.hasValue({ value: props['scheduledAt'] });
  if (publishMode === 'SCHEDULE' && !hasSchedule) {
    throw new Error('Publish Mode is Schedule, so set Scheduled Time (at least 10 minutes ahead).');
  }
  if (publishMode !== 'SCHEDULE' && hasSchedule) {
    throw new Error('Scheduled Time is only used when Publish Mode is Schedule. Clear it or switch Publish Mode to Schedule.');
  }
  const schedule = publishMode === 'SCHEDULE' ? await nuelinkTime.scheduleForBrand({ apiKey, brandId, value: props['scheduledAt'], label: 'Scheduled Time' }) : undefined;
  const data = await nuelinkClient.request({
    apiKey,
    method: HttpMethod.POST,
    path: ['brands', brandId, 'collections', collectionId, 'posts'],
    body: {
      ...(caption === undefined ? {} : { caption }),
      ...(poll === undefined ? {} : { poll }),
      publishMode,
      ...(schedule === undefined ? {} : { scheduledAt: schedule.local }),
      ...(title === undefined ? {} : { title }),
      ...(alt === undefined ? {} : { alt }),
      ...(link === undefined ? {} : { link }),
      ...(media.length === 0 ? {} : { media }),
      ...(nuelinkInputs.isChecked({ value: props['postAsStory'] }) ? { postAsStory: true } : {}),
      ...(nuelinkInputs.isChecked({ value: props['autoThreadText'] }) ? { autoThreadText: true } : {}),
      ...(comment === undefined ? {} : { comment }),
      ...(platforms === undefined ? {} : { platforms }),
    },
    timeoutMs: NUELINK_LIMITS.createTimeoutMs,
    timeoutHint: NUELINK_LIMITS.createTimeoutHint,
  });
  const record = nuelinkClient.isRecord(data) ? data : {};
  return {
    id: record['id'] ?? null,
    message: record['message'] ?? null,
    brandId,
    collectionId,
    publishMode,
    scheduledAt: schedule?.local ?? null,
    scheduledAtUtc: schedule?.utc ?? null,
    brandTimezone: schedule?.timeZone ?? null,
  };
}

async function update({ apiKey, brandId, postId, props }: { apiKey: string; brandId: string; postId: string; props: Record<string, unknown> }) {
  const caption = nuelinkInputs.optionalText({ value: props['caption'], label: 'New Caption', max: 3000 });
  const publishMode = nuelinkInputs.oneOf({ value: props['publishMode'], label: 'New Publish Mode', allowed: UPDATE_MODES });
  const queuePosition = nuelinkInputs.oneOf({ value: props['queuePosition'], label: 'Queue Position', allowed: QUEUE_POSITIONS });
  const hasSchedule = nuelinkInputs.hasValue({ value: props['scheduledAt'] });
  if (caption === undefined && publishMode === undefined && queuePosition === undefined) {
    throw new Error('Nothing to update. Set New Caption, New Publish Mode or Queue Position.');
  }
  if (publishMode === 'SCHEDULE' && !hasSchedule) {
    throw new Error('New Publish Mode is Schedule, so set Scheduled Time (at least 10 minutes ahead).');
  }
  if (publishMode !== 'SCHEDULE' && hasSchedule) {
    throw new Error('Scheduled Time is only used when New Publish Mode is Schedule. Clear it or switch the mode to Schedule.');
  }
  if (queuePosition !== undefined && publishMode !== undefined && publishMode !== 'QUEUE') {
    throw new Error('Queue Position only works on its own or with New Publish Mode = Add to Queue.');
  }
  const scheduledAt = publishMode === 'SCHEDULE' ? (await nuelinkTime.scheduleForBrand({ apiKey, brandId, value: props['scheduledAt'], label: 'Scheduled Time' })).local : undefined;
  return nuelinkClient.request({
    apiKey,
    method: HttpMethod.PATCH,
    path: ['brands', brandId, 'posts', postId],
    body: {
      ...(caption === undefined ? {} : { caption }),
      ...(publishMode === undefined ? {} : { publishMode }),
      ...(scheduledAt === undefined ? {} : { scheduledAt }),
      ...(queuePosition === undefined ? {} : { queuePosition }),
    },
  });
}

async function remove({ apiKey, brandId, postId }: { apiKey: string; brandId: string; postId: string }) {
  return nuelinkClient.request({
    apiKey,
    method: HttpMethod.DELETE,
    path: ['brands', brandId, 'posts', postId],
  });
}

async function list({ apiKey, brandId, collectionId, props }: { apiKey: string; brandId: string; collectionId: string | undefined; props: Record<string, unknown> }) {
  const createdFrom = nuelinkInputs.hasValue({ value: props['createdFrom'] }) ? nuelinkTime.toUtcFilter({ value: props['createdFrom'], label: 'Created From' }) : undefined;
  const createdTo = nuelinkInputs.hasValue({ value: props['createdTo'] }) ? nuelinkTime.toUtcFilter({ value: props['createdTo'], label: 'Created To' }) : undefined;
  if (createdFrom !== undefined && createdTo !== undefined && createdFrom > createdTo) {
    throw new Error('Created To must not be earlier than Created From.');
  }
  const { page, perPage } = nuelinkInputs.paging({ page: props['page'], perPage: props['perPage'] });
  return nuelinkClient.getPage({
    apiKey,
    path: ['brands', brandId, 'posts'],
    page,
    perPage,
    query: {
      collection_id: collectionId,
      view: nuelinkInputs.oneOf({ value: props['view'], label: 'Show', allowed: VIEWS }),
      status: nuelinkInputs.oneOf({ value: props['status'], label: 'Status', allowed: POST_STATUSES }),
      post_type: nuelinkInputs.oneOf({ value: props['postType'], label: 'Post Type', allowed: POST_TYPES }),
      posting_type: nuelinkInputs.oneOf({ value: props['postingType'], label: 'Posting Type', allowed: POSTING_TYPES }),
      created_from: createdFrom,
      created_to: createdTo,
      sort_by: nuelinkInputs.oneOf({ value: props['sortBy'], label: 'Sort By', allowed: POST_SORT_FIELDS }),
      sort_order: nuelinkInputs.oneOf({ value: props['sortOrder'], label: 'Sort Order', allowed: SORT_ORDERS }),
    },
  });
}

async function listPublished({ apiKey, brandId, props, ids }: { apiKey: string; brandId: string; props: Record<string, unknown>; ids: { collection: unknown; channel: unknown; post: unknown } }) {
  const publishedFrom = nuelinkInputs.hasValue({ value: props['publishedFrom'] }) ? nuelinkTime.toUtcFilter({ value: props['publishedFrom'], label: 'Published From' }) : undefined;
  const publishedTo = nuelinkInputs.hasValue({ value: props['publishedTo'] }) ? nuelinkTime.toUtcFilter({ value: props['publishedTo'], label: 'Published To' }) : undefined;
  if (publishedFrom !== undefined && publishedTo !== undefined && publishedFrom > publishedTo) {
    throw new Error('Published To must not be earlier than Published From.');
  }
  const { page, perPage } = nuelinkInputs.paging({ page: props['page'], perPage: props['perPage'] });
  return nuelinkClient.getPage({
    apiKey,
    path: ['brands', brandId, 'published-posts'],
    page,
    perPage,
    query: {
      status: nuelinkInputs.oneOf({ value: props['status'], label: 'Delivery Status', allowed: DELIVERY_STATUSES }),
      collection_id: nuelinkInputs.optionalId({ value: ids.collection, label: 'Collection' }),
      channel_id: nuelinkInputs.optionalId({ value: ids.channel, label: 'Channel' }),
      post_id: nuelinkInputs.optionalId({ value: ids.post, label: 'Post ID' }),
      post_type: nuelinkInputs.optionalText({ value: props['postType'], label: 'Post Type', max: 50 })?.trim(),
      search: nuelinkInputs.optionalText({ value: props['search'], label: 'Search Text', max: 255 })?.trim(),
      published_from: publishedFrom,
      published_to: publishedTo,
      sort_by: nuelinkInputs.oneOf({ value: props['sortBy'], label: 'Sort By', allowed: PUBLISHED_SORT_FIELDS }),
      sort_order: nuelinkInputs.oneOf({ value: props['sortOrder'], label: 'Sort Order', allowed: SORT_ORDERS }),
    },
  });
}

async function upload({ apiKey, brandId, file }: { apiKey: string; brandId: string; file: unknown }) {
  const checked = fileOf({ value: file });
  const form = new FormData();
  form.append('media', new Blob([new Uint8Array(checked.data)], { type: checked.mimeType }), checked.filename);
  return nuelinkClient.request({
    apiKey,
    method: HttpMethod.POST,
    path: ['brands', brandId, 'media'],
    body: form,
    timeoutMs: NUELINK_LIMITS.uploadTimeoutMs,
    timeoutHint: 'The file may still have been uploaded; check the brand\'s media library in Nuelink before uploading it again.',
  });
}

function firstComment({ text, delay }: { text: unknown; delay: unknown }): { comment: string; delay: number } | undefined {
  const comment = nuelinkInputs.optionalText({ value: text, label: 'First Comment', max: 1000 });
  const seconds = nuelinkInputs.optionalInteger({ value: delay, label: 'First Comment Delay (seconds)', min: 0, max: 31_536_000 });
  if (comment === undefined && seconds === undefined) {
    return undefined;
  }
  if (comment === undefined || seconds === undefined) {
    throw new Error('Set First Comment and First Comment Delay together, or leave both empty.');
  }
  return { comment, delay: seconds };
}

function platformOptions({ props }: { props: Record<string, unknown> }): Record<string, Record<string, unknown>> | undefined {
  const collab = nuelinkInputs.optionalText({ value: props['instagramCollab'], label: 'Instagram: Collaborator', max: 1000 });
  const tags = nuelinkInputs.stringList({ value: props['youtubeTags'], label: 'YouTube: Tags', maxItems: 500, maxLength: 255 });
  const instagram = {
    ...(nuelinkInputs.isChecked({ value: props['instagramShareToFeed'] }) ? { shareToFeed: true } : {}),
    ...(collab === undefined ? {} : { collab: collab.trim() }),
  };
  const tiktok = nuelinkInputs.isChecked({ value: props['tiktokAutoAddMusic'] }) ? { autoAddMusic: true } : {};
  const youtube = tags.length === 0 ? {} : { tags };
  const platforms = Object.fromEntries(Object.entries({ instagram, tiktok, youtube }).filter(([, options]) => Object.keys(options).length > 0));
  return Object.keys(platforms).length === 0 ? undefined : platforms;
}

function fileOf({ value }: { value: unknown }): { filename: string; data: Buffer; mimeType: string } {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Select a file to upload.');
  }
  const filename = Reflect.get(value, 'filename');
  const data = Reflect.get(value, 'data');
  if (typeof filename !== 'string' || !Buffer.isBuffer(data)) {
    throw new Error('The File input did not contain a readable file. Map a file from an earlier step or upload one.');
  }
  const declared = Reflect.get(value, 'extension');
  const extension = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
    : typeof declared === 'string'
      ? declared.replace(/^\./, '').toLowerCase()
      : '';
  const mimeType = MIME_TYPES[extension];
  if (mimeType === undefined) {
    throw new Error(`Nuelink accepts JPG, JPEG, PNG, BMP, MP4, MOV and PDF files; "${filename}" is not one of them.`);
  }
  if (data.length === 0) {
    throw new Error(`"${filename}" is empty.`);
  }
  if (data.length > MAX_UPLOAD_BYTES) {
    throw new Error(`"${filename}" is ${(data.length / 1048576).toFixed(1)} MB; Nuelink accepts files up to 100 MB.`);
  }
  return { filename, data, mimeType };
}

export const nuelinkCollectionChannels = {
  add: addCollectionChannel,
  remove: removeCollectionChannel,
};

async function addCollectionChannel({ apiKey, brandId, collectionId, channelId }: { apiKey: string; brandId: string; collectionId: string; channelId: number }) {
  return nuelinkClient.request({ apiKey, method: HttpMethod.POST, path: ['brands', brandId, 'collections', collectionId, 'channels'], body: { channelId } });
}

async function removeCollectionChannel({ apiKey, brandId, collectionId, channelId }: { apiKey: string; brandId: string; collectionId: string; channelId: string }) {
  return nuelinkClient.request({ apiKey, method: HttpMethod.DELETE, path: ['brands', brandId, 'collections', collectionId, 'channels', channelId] });
}

export const PUBLISH_MODES = ['DRAFT', 'QUEUE', 'SCHEDULE', 'IMMEDIATE'] as const;
export const UPDATE_MODES = ['DRAFT', 'QUEUE', 'SCHEDULE'] as const;
export const QUEUE_POSITIONS = ['FRONT', 'BACK'] as const;
export const POST_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'MULTIMEDIA', 'SHORT', 'DOCUMENT', 'THREAD', 'SLIDES', 'REEL', 'TIKTOK', 'STORY', 'POLL', 'ENGAGE_COMMENT'] as const;
export const VIEWS = ['QUEUE', 'SCHEDULED', 'DRAFT', 'PUBLISHED'] as const;
export const POST_STATUSES = ['PENDING', 'DRAFT', 'PUBLISHED'] as const;
export const POSTING_TYPES = ['NOW', 'SCHEDULE', 'QUEUE', 'DRAFT'] as const;
export const POST_SORT_FIELDS = ['id', 'title', 'post_date', 'created_at', 'updated_at'] as const;
export const DELIVERY_STATUSES = ['PUBLISHED', 'FAILED', 'RETRYING', 'SKIPPED', 'SENT'] as const;
export const PUBLISHED_SORT_FIELDS = ['id', 'created_at', 'likes', 'comments', 'shares'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

export const FEED_TYPES = [
  'RSS',
  'ATOM',
  'YOUTUBE',
  'MEDIUM',
  'SHOPIFY',
  'WORDPRESS',
  'WOOCOMMERCE',
  'ETSY',
  'GHOST',
  'SUBSTACK',
  'ANCHOR',
  'TRANSISTOR',
  'CAPTIVATE',
  'SOUNDCLOUD',
  'BLOGGER',
  'WIX',
  'SQUARESPACEBLOG',
  'SQUARESPACESHOP',
  'WEEBLY',
  'TUMBLR',
  'SHOPIFY2',
  'WOOCOMMERCE2',
  'PRESTASHOP',
  'BUZZSPROUT',
  'RSSCOM',
  'CASTOS',
  'PODCASTCO',
] as const;
export const IMPORT_TYPES = ['LINK', 'IMAGE', 'VIDEO', 'CAROUSEL'] as const;
export const REFRESH_RATES: readonly number[] = [1, 6, 12, 24];

export const MEDIA_TYPES = ['IMAGE', 'VIDEO', 'GIF', 'APPLICATION', 'DOCUMENT', 'CSV'] as const;

const MAX_UPLOAD_BYTES = 104_857_600;
const MIME_TYPES: Record<string, string | undefined> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  bmp: 'image/bmp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};
