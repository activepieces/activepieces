import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedVideo,
  AppBskyFeedPost,
  AtpAgent,
  BlobRef,
  RichText,
} from '@atproto/api';
import { blueskyAtproto } from './atproto';
import { blueskyDownload } from './download';
import { blueskyRefs } from './refs';

const MAX_POST_GRAPHEMES = 300;
const MAX_TAGS = 8;
const MAX_TAG_GRAPHEMES = 64;
const MAX_IMAGES = 4;
const MAX_LANGS = 3;
const MAX_IMAGE_BYTES = 1_000_000;
const MAX_VIDEO_BYTES = 52_428_800;
const MAX_HTML_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 15_000;
const HTML_ACCEPT = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8';
const VIDEO_FETCH_TIMEOUT_MS = 120_000;
const MAX_META_TAG_LENGTH = 2_000;
const LEGACY_WARNING_MAP: Record<string, string | null> = {
  adult: 'porn',
  violence: 'graphic-media',
  sensitive: 'sexual',
  spam: null,
  'graphic-media': 'graphic-media',
  sexual: 'sexual',
  nudity: 'nudity',
  porn: 'porn',
};
const SELF_LABEL_VALUES = ['sexual', 'nudity', 'porn', 'graphic-media'];

function graphemeLength(text: string): number {
  return blueskyAtproto.graphemeLength(text);
}

async function buildRichText({ agent, text }: { agent: AtpAgent; text: string }): Promise<RichText> {
  const { RichText } = await blueskyAtproto.load();
  const richText = new RichText({ text });
  await richText.detectFacets(agent);
  return richText;
}

function assertPostLength({ text, label }: { text: string; label: string }): void {
  const length = graphemeLength(text);
  if (length > MAX_POST_GRAPHEMES) {
    throw new Error(`${label} is ${length} characters long; Bluesky allows at most ${MAX_POST_GRAPHEMES}.`);
  }
}

function normalizeTags(raw: unknown[]): string[] {
  const tags = raw
    .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter((tag) => tag !== '');
  const unique = [...new Set(tags)];
  if (unique.length > MAX_TAGS) {
    throw new Error(`Bluesky allows at most ${MAX_TAGS} tags per post; got ${unique.length}.`);
  }
  const tooLong = unique.find((tag) => graphemeLength(tag) > MAX_TAG_GRAPHEMES);
  if (tooLong !== undefined) {
    throw new Error(`The tag "${tooLong}" is longer than ${MAX_TAG_GRAPHEMES} characters.`);
  }
  return unique;
}

function normalizeLangs(raw: unknown[]): string[] {
  const langs = [...new Set(raw.flatMap((value) => (typeof value === 'string' && value.trim() !== '' ? [value.trim()] : [])))];
  if (langs.length > MAX_LANGS) {
    throw new Error(`Bluesky allows at most ${MAX_LANGS} languages per post; got ${langs.length}.`);
  }
  return langs;
}

function mapContentWarnings(raw: unknown[]): string[] {
  const mapped = raw.flatMap((value) => {
    if (typeof value !== 'string') {
      return [];
    }
    const label = value in LEGACY_WARNING_MAP ? LEGACY_WARNING_MAP[value] : null;
    return label === null ? [] : [label];
  });
  return [...new Set(mapped)];
}

function selfLabels(values: string[]): AppBskyFeedPost.Record['labels'] {
  const valid = values.filter((value) => SELF_LABEL_VALUES.includes(value));
  if (valid.length === 0) {
    return undefined;
  }
  return {
    $type: 'com.atproto.label.defs#selfLabels',
    values: valid.map((val) => ({ val })),
  };
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((value) => (typeof value === 'string' && value.trim() !== '' ? [value.trim()] : []));
}

function assertHttpUrl({ url, label }: { url: string; label: string }): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} "${url}" is not a valid URL.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} "${url}" must start with http:// or https://.`);
  }
  return parsed;
}

async function fetchBinary({
  url,
  maxBytes,
  timeoutMs = FETCH_TIMEOUT_MS,
  accept = '*/*',
  label,
}: {
  url: string;
  maxBytes: number;
  timeoutMs?: number;
  accept?: string;
  label: string;
}): Promise<{ data: Uint8Array; contentType: string }> {
  return blueskyDownload.download({ url, maxBytes, timeoutMs, accept, label });
}

function sniffImageType(data: Uint8Array): string | undefined {
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    return 'image/png';
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg';
  }
  if (data.length >= 6 && data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) {
    return 'image/gif';
  }
  if (
    data.length >= 12 &&
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  ) {
    return 'image/webp';
  }
  return undefined;
}

function imageEncoding({ data, contentType, url }: { data: Uint8Array; contentType: string; url: string }): string {
  const sniffed = sniffImageType(data);
  if (sniffed) {
    return sniffed;
  }
  if (contentType.startsWith('image/')) {
    return contentType;
  }
  throw new Error(`The file at ${url} is not a PNG, JPEG, GIF or WebP image.`);
}

async function uploadImages({
  agent,
  images,
}: {
  agent: AtpAgent;
  images: { url: string; alt: string }[];
}): Promise<$Typed<AppBskyEmbedImages.Main> | undefined> {
  if (images.length === 0) {
    return undefined;
  }
  if (images.length > MAX_IMAGES) {
    throw new Error(`Bluesky allows at most ${MAX_IMAGES} images per post; got ${images.length}.`);
  }
  const uploaded: { alt: string; image: BlobRef }[] = [];
  for (const [index, image] of images.entries()) {
    const { data, contentType } = await fetchBinary({ url: image.url, maxBytes: MAX_IMAGE_BYTES, label: `Image ${index + 1}` });
    const encoding = imageEncoding({ data, contentType, url: image.url });
    const blob = await agent.uploadBlob(data, { encoding });
    uploaded.push({ alt: image.alt, image: blob.data.blob });
  }
  return { $type: 'app.bsky.embed.images', images: uploaded };
}

async function uploadVideo({
  agent,
  url,
  alt,
  captions,
}: {
  agent: AtpAgent;
  url: string;
  alt?: string;
  captions: { url: string; lang: string }[];
}): Promise<$Typed<AppBskyEmbedVideo.Main>> {
  const { data, contentType } = await fetchBinary({ url, maxBytes: MAX_VIDEO_BYTES, timeoutMs: VIDEO_FETCH_TIMEOUT_MS, label: 'Video' });
  if (contentType !== '' && !contentType.startsWith('video/') && contentType !== 'application/octet-stream') {
    throw new Error(`The file at ${url} is not a video (content type ${contentType}).`);
  }
  const video = await agent.uploadBlob(data, { encoding: contentType.startsWith('video/') ? contentType : 'video/mp4' });
  const captionRefs: { lang: string; file: BlobRef }[] = [];
  for (const caption of captions) {
    const file = await fetchBinary({ url: caption.url, maxBytes: 20_000, label: 'Caption file' });
    const blob = await agent.uploadBlob(file.data, { encoding: 'text/vtt' });
    captionRefs.push({ lang: caption.lang, file: blob.data.blob });
  }
  return {
    $type: 'app.bsky.embed.video',
    video: video.data.blob,
    ...(alt ? { alt } : {}),
    ...(captionRefs.length > 0 ? { captions: captionRefs } : {}),
  };
}

function metaTags(html: string): Record<string, string> {
  const tags = html.match(new RegExp(`<meta\\b[^>]{0,${MAX_META_TAG_LENGTH}}>`, 'gi')) ?? [];
  return tags.reduce<Record<string, string>>((found, tag) => {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([a-zA-Z:_-]{1,40})\s*=\s*("([^"]*)"|'([^']*)')/g)].map((match) => [
        match[1].toLowerCase(),
        match[3] ?? match[4] ?? '',
      ]),
    );
    const name = (attributes['property'] ?? attributes['name'] ?? '').toLowerCase();
    const content = attributes['content'];
    if (name === '' || content === undefined || name in found) {
      return found;
    }
    return { ...found, [name]: decodeEntities(content.trim()) };
  }, {});
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function htmlTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]{0,200}>([^<]{0,500})<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : undefined;
}

async function buildLinkCard({ agent, url }: { agent: AtpAgent; url: string }): Promise<$Typed<AppBskyEmbedExternal.Main>> {
  assertHttpUrl({ url, label: 'Link' });
  const basic = { uri: url, title: url, description: 'Shared link' };
  let html: string;
  try {
    const page = await fetchBinary({ url, maxBytes: MAX_HTML_BYTES, accept: HTML_ACCEPT, label: 'Link page' });
    html = new TextDecoder().decode(page.data);
  } catch {
    return { $type: 'app.bsky.embed.external', external: basic };
  }
  const meta = metaTags(html);
  const title = meta['og:title'] || meta['twitter:title'] || htmlTitle(html) || url;
  const description = meta['og:description'] || meta['description'] || meta['twitter:description'] || 'Shared link';
  const imageUrl = meta['og:image'] || meta['twitter:image'];
  const thumb = imageUrl ? await uploadThumb({ agent, imageUrl, pageUrl: url }) : undefined;
  return {
    $type: 'app.bsky.embed.external',
    external: { uri: url, title, description, ...(thumb ? { thumb } : {}) },
  };
}

async function uploadThumb({ agent, imageUrl, pageUrl }: { agent: AtpAgent; imageUrl: string; pageUrl: string }): Promise<BlobRef | undefined> {
  try {
    const absolute = new URL(imageUrl, pageUrl).href;
    const { data, contentType } = await fetchBinary({ url: absolute, maxBytes: MAX_IMAGE_BYTES, label: 'Link thumbnail' });
    const encoding = sniffImageType(data) ?? (contentType.startsWith('image/') ? contentType : undefined);
    if (!encoding) {
      return undefined;
    }
    const blob = await agent.uploadBlob(data, { encoding });
    return blob.data.blob;
  } catch {
    return undefined;
  }
}

async function fetchPostView({ agent, input }: { agent: AtpAgent; input: string }) {
  const ref = await blueskyRefs.resolvePostRef({ agent, input });
  const response = await agent.getPosts({ uris: [ref.uri] });
  const post = response.data.posts[0];
  if (!post) {
    throw new Error(`The post ${input} was not found or is not visible to this account.`);
  }
  return post;
}

async function replyRefs({ agent, input }: { agent: AtpAgent; input: string }) {
  const parent = await fetchPostView({ agent, input });
  const parentRef = { uri: parent.uri, cid: parent.cid };
  return { root: replyRootOf(parent.record) ?? parentRef, parent: parentRef };
}

function replyRootOf(record: unknown): { uri: string; cid: string } | undefined {
  if (typeof record !== 'object' || record === null || !('reply' in record)) {
    return undefined;
  }
  const reply: unknown = record.reply;
  if (typeof reply !== 'object' || reply === null || !('root' in reply)) {
    return undefined;
  }
  const root: unknown = reply.root;
  if (typeof root === 'object' && root !== null && 'uri' in root && 'cid' in root && typeof root.uri === 'string' && typeof root.cid === 'string') {
    return { uri: root.uri, cid: root.cid };
  }
  return undefined;
}

async function quoteRef({ agent, input }: { agent: AtpAgent; input: string }) {
  const quoted = await fetchPostView({ agent, input });
  return { uri: quoted.uri, cid: quoted.cid };
}

function combineEmbed({
  quote,
  media,
}: {
  quote?: { uri: string; cid: string };
  media?: MediaEmbed;
}): AppBskyFeedPost.Record['embed'] {
  if (quote && media) {
    return {
      $type: 'app.bsky.embed.recordWithMedia',
      record: { $type: 'app.bsky.embed.record', record: quote },
      media,
    };
  }
  if (quote) {
    return { $type: 'app.bsky.embed.record', record: quote };
  }
  return media;
}

export const blueskyCompose = {
  MAX_POST_GRAPHEMES,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  SELF_LABEL_VALUES,
  graphemeLength,
  buildRichText,
  assertPostLength,
  normalizeTags,
  normalizeLangs,
  mapContentWarnings,
  selfLabels,
  stringList,
  uploadImages,
  uploadVideo,
  buildLinkCard,
  metaTags,
  sniffImageType,
  fetchBinary,
  replyRefs,
  quoteRef,
  fetchPostView,
  combineEmbed,
};

type MediaEmbed = $Typed<AppBskyEmbedImages.Main> | $Typed<AppBskyEmbedVideo.Main> | $Typed<AppBskyEmbedExternal.Main>;
