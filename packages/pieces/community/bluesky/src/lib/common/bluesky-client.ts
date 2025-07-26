import { BskyAgent, RichText } from '@atproto/api';

export interface BlueskyAuth {
  serviceUrl: string;
  identifier: string;
  password: string;
}

export interface BlueskyPostOptions {
  text: string;
  images?: Array<{ base64: string; alt?: string; mimeType?: string; }>;
  hashtags?: string;
  language?: string[];
  replyTo?: { root: { uri: string; cid: string }; parent: { uri: string; cid: string } };
  quote?: { uri: string; cid: string };
  websiteCard?: { url: string; title: string; description?: string; thumbnailBase64?: string; thumbnailMimeType?: string };
}

export async function postToBluesky(auth: BlueskyAuth, options: BlueskyPostOptions) {
  const agent = new BskyAgent({ service: auth.serviceUrl });
  await agent.login({ identifier: auth.identifier, password: auth.password });

  // RichText for mentions/links
  const rt = new RichText({ text: options.text });
  await rt.detectFacets(agent);

  // Prepare post record
  const postRecord: any = {
    $type: 'app.bsky.feed.post',
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  };

  if (options.language) {
    postRecord.langs = options.language;
  }

  // Handle reply
  if (options.replyTo) {
    postRecord.reply = {
      root: options.replyTo.root,
      parent: options.replyTo.parent,
    };
  }

  // Handle quote
  if (options.quote) {
    postRecord.embed = {
      $type: 'app.bsky.embed.record',
      record: options.quote,
    };
  }

  // Handle website card
  if (options.websiteCard) {
    let thumbBlob;
    if (options.websiteCard.thumbnailBase64 && options.websiteCard.thumbnailMimeType) {
      const thumbRes = await agent.uploadBlob(Buffer.from(options.websiteCard.thumbnailBase64, 'base64'), {
        encoding: options.websiteCard.thumbnailMimeType,
      });
      thumbBlob = thumbRes.data.blob;
    }
    postRecord.embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: options.websiteCard.url,
        title: options.websiteCard.title,
        description: options.websiteCard.description,
        thumb: thumbBlob,
      },
    };
  }

  // Handle images
  if (options.images && options.images.length > 0) {
    const images = [];
    for (const img of options.images) {
      const res = await agent.uploadBlob(Buffer.from(img.base64, 'base64'), {
        encoding: img.mimeType || 'image/png',
      });
      images.push({
        image: res.data.blob,
        alt: img.alt || '',
      });
    }
    postRecord.embed = {
      $type: 'app.bsky.embed.images',
      images,
    };
  }

  // Post
  const response = await agent.post(postRecord);
  return response;
} 