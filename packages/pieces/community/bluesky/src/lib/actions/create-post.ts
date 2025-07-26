import { createAction, Property } from '@activepieces/pieces-framework';
import { postToBluesky, type BlueskyAuth, type BlueskyPostOptions } from '../common/bluesky-client';
import { blueskyAuth } from '../..';

function getMimeTypeFromExtension(extension?: string): string {
  if (!extension) return 'image/png';
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function isNonEmptyString(str: string | undefined): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

export const createPost = createAction({
  auth: blueskyAuth,
  name: 'create-post',
  displayName: 'Create Post',
  description: 'Publish a new post with text, images, and options to Bluesky.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The content of the post.',
      required: true,
    }),
    image_1: Property.File({
      displayName: 'Image 1',
      required: false,
    }),
    image_2: Property.File({
      displayName: 'Image 2',
      required: false,
    }),
    image_3: Property.File({
      displayName: 'Image 3',
      required: false,
    }),
    image_4: Property.File({
      displayName: 'Image 4',
      required: false,
    }),
    hashtags: Property.ShortText({
      displayName: 'Hashtags',
      description: 'Comma-separated hashtags (optional)',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code(s), comma-separated (optional)',
      required: false,
    }),
    replyRootUri: Property.ShortText({
      displayName: 'Reply Root URI',
      description: 'Root post URI if replying (optional)',
      required: false,
    }),
    replyRootCid: Property.ShortText({
      displayName: 'Reply Root CID',
      description: 'Root post CID if replying (optional)',
      required: false,
    }),
    replyParentUri: Property.ShortText({
      displayName: 'Reply Parent URI',
      description: 'Parent post URI if replying (optional)',
      required: false,
    }),
    replyParentCid: Property.ShortText({
      displayName: 'Reply Parent CID',
      description: 'Parent post CID if replying (optional)',
      required: false,
    }),
    quoteUri: Property.ShortText({
      displayName: 'Quote Post URI',
      description: 'URI of the post to quote (optional)',
      required: false,
    }),
    quoteCid: Property.ShortText({
      displayName: 'Quote Post CID',
      description: 'CID of the post to quote (optional)',
      required: false,
    }),
    websiteUrl: Property.ShortText({
      displayName: 'Website Card URL',
      description: 'URL to embed as a website card (optional)',
      required: false,
    }),
    websiteTitle: Property.ShortText({
      displayName: 'Website Card Title',
      description: 'Title for the website card (optional)',
      required: false,
    }),
    websiteDescription: Property.ShortText({
      displayName: 'Website Card Description',
      description: 'Description for the website card (optional)',
      required: false,
    }),
    websiteThumb: Property.File({
      displayName: 'Website Card Thumbnail',
      description: 'Thumbnail image for the website card (optional)',
      required: false,
    }),
  },
  async run(context) {
    try {
      const {
        text, image_1, image_2, image_3, image_4, hashtags, language,
        replyRootUri, replyRootCid, replyParentUri, replyParentCid,
        quoteUri, quoteCid,
        websiteUrl, websiteTitle, websiteDescription, websiteThumb
      } = context.propsValue;

      if (!isNonEmptyString(text)) {
        return { error: 'Text is required and cannot be empty or whitespace.' };
      }

      let postText = text;
      if (isNonEmptyString(hashtags)) {
        const tags = hashtags!.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          postText += '\n' + tags.map(t => (t.startsWith('#') ? t : `#${t}`)).join(' ');
        }
      }

      const images = [image_1, image_2, image_3, image_4].filter(Boolean).map((img: any) => ({
        base64: img.base64,
        alt: img.name || '',
        mimeType: getMimeTypeFromExtension(img.extension),
      }));

      const langs = isNonEmptyString(language) ? language!.split(',').map((l: string) => l.trim()) : undefined;

      let replyTo = undefined;
      if ([replyRootUri, replyRootCid, replyParentUri, replyParentCid].every(isNonEmptyString)) {
        replyTo = {
          root: { uri: replyRootUri!, cid: replyRootCid! },
          parent: { uri: replyParentUri!, cid: replyParentCid! },
        };
      } else if ([replyRootUri, replyRootCid, replyParentUri, replyParentCid].some(isNonEmptyString)) {
        return { error: 'All reply fields (root URI, root CID, parent URI, parent CID) must be provided for a reply.' };
      }

      let quote = undefined;
      if (isNonEmptyString(quoteUri) && isNonEmptyString(quoteCid)) {
        quote = { uri: quoteUri!, cid: quoteCid! };
      } else if (isNonEmptyString(quoteUri) || isNonEmptyString(quoteCid)) {
        return { error: 'Both quote URI and quote CID must be provided for a quote post.' };
      }

      let websiteCard = undefined;
      if (isNonEmptyString(websiteUrl) && isNonEmptyString(websiteTitle)) {
        websiteCard = {
          url: websiteUrl!,
          title: websiteTitle!,
          description: websiteDescription,
          thumbnailBase64: websiteThumb?.base64,
          thumbnailMimeType: getMimeTypeFromExtension(websiteThumb?.extension),
        };
      }

      const auth: BlueskyAuth = {
        serviceUrl: context.auth.serviceUrl,
        identifier: context.auth.identifier,
        password: context.auth.password,
      };
      const options: BlueskyPostOptions = {
        text: postText,
        images: images.length > 0 ? images : undefined,
        hashtags,
        language: langs,
        replyTo,
        quote,
        websiteCard,
      };
      const response = await postToBluesky(auth, options);
      return response;
    } catch (error: any) {
      return { error: error.message || 'Failed to create post.' };
    }
  },
}); 