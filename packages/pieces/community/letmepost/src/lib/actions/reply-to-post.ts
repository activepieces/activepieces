import { createAction, Property } from '@activepieces/pieces-framework';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { letmepostClient } from '../common/client';
import { publishPostOutputSchema } from '../common/output-schemas';

function replyOptions({ platform, values }: { platform: string; values: ReplyValues }): Record<string, string> {
  const text = (value: unknown) => letmepostClient.optionalText(value);
  if (platform === 'twitter') {
    const replyToTweetId = text(values.replyToTweetId);
    if (replyToTweetId === undefined) {
      throw new Error('This is an X account: fill in X tweet ID to reply to.');
    }
    return { platform, replyToTweetId };
  }
  if (platform === 'threads') {
    const replyToId = text(values.replyToThreadsId);
    if (replyToId === undefined) {
      throw new Error('This is a Threads account: fill in Threads post ID to reply to.');
    }
    return { platform, replyToId };
  }
  if (platform === 'bluesky') {
    const replyToUri = text(values.replyToUri);
    const replyToCid = text(values.replyToCid);
    const replyRootUri = text(values.replyRootUri);
    const replyRootCid = text(values.replyRootCid);
    if (replyToUri === undefined || replyToCid === undefined) {
      throw new Error('This is a Bluesky account: fill in both Bluesky parent URI and Bluesky parent CID (the uri and cid of the post you reply to).');
    }
    if ((replyRootUri === undefined) !== (replyRootCid === undefined)) {
      throw new Error('Fill in both Bluesky root URI and Bluesky root CID, or leave both empty.');
    }
    return {
      platform,
      replyToUri,
      replyToCid,
      ...(replyRootUri !== undefined && replyRootCid !== undefined ? { replyRootUri, replyRootCid } : {}),
    };
  }
  throw new Error(`Replies are supported on X, Threads and Bluesky accounts only; this account is on ${platform}.`);
}

export const replyToPost = createAction({
  auth: letmepostAuth,
  name: 'reply_to_post',
  classification: 'WRITE',
  displayName: 'Reply to a Post',
  description: 'Publish a reply under an existing post on X, Threads or Bluesky',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a reply right away from one connected X, Threads or Bluesky account under an existing post. X needs the tweet id; Threads needs the post id; Bluesky needs the parent uri and cid (from Publish or Schedule a Post results), plus the thread root uri and cid when replying deeper in a thread. For a new top-level post use Publish or Schedule a Post. Fails when the reply is rejected. Not idempotent unless an Idempotency Key is supplied.',
    idempotent: false,
  },
  props: {
    account: letmepostCommon.accountDropdown({
      displayName: 'Account',
      description: 'The X, Threads or Bluesky account that replies. You can also map an account id from List Accounts.',
      platforms: ['twitter', 'threads', 'bluesky'],
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The reply text.',
      required: false,
    }),
    media: letmepostCommon.mediaProperty(),
    replyToTweetId: Property.ShortText({
      displayName: 'X tweet ID',
      description: 'X accounts: id of the tweet to reply to.',
      required: false,
    }),
    replyToThreadsId: Property.ShortText({
      displayName: 'Threads post ID',
      description: 'Threads accounts: id of the Threads post to reply to.',
      required: false,
    }),
    replyToUri: Property.ShortText({
      displayName: 'Bluesky parent URI',
      description: 'Bluesky accounts: at:// URI of the post to reply to (results uri of a publish).',
      required: false,
    }),
    replyToCid: Property.ShortText({
      displayName: 'Bluesky parent CID',
      description: 'Bluesky accounts: CID of the post to reply to (results cid of a publish).',
      required: false,
    }),
    replyRootUri: Property.ShortText({
      displayName: 'Bluesky root URI',
      description: 'Bluesky accounts, optional: at:// URI of the first post of the thread, when replying to a reply.',
      required: false,
    }),
    replyRootCid: Property.ShortText({
      displayName: 'Bluesky root CID',
      description: 'Bluesky accounts, optional: CID of the first post of the thread. Give it together with the root URI.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency key',
      description: 'Reusing the same key never publishes twice, which makes retries safe (up to 128 characters, remembered for 24 hours).',
      required: false,
    }),
  },
  outputSchema: publishPostOutputSchema,
  async run(context) {
    const { account, text, media, idempotencyKey } = context.propsValue;
    const cleanedMedia = letmepostCommon.cleanMedia(media);
    const replyText = letmepostClient.optionalText(text);
    if (replyText === undefined && cleanedMedia === undefined) {
      throw new Error('Give the reply some Text or Media.');
    }
    const resolved = await letmepostCommon.getAccount({ auth: context.auth, accountId: account });
    const options = replyOptions({ platform: resolved.platform, values: context.propsValue });
    return letmepostCommon.createPost({
      auth: context.auth,
      body: {
        targets: [{ accountId: resolved.id, options }],
        publishNow: true,
        ...(replyText !== undefined ? { text: replyText } : {}),
        ...(cleanedMedia !== undefined ? { media: cleanedMedia } : {}),
      },
      idempotencyKey: idempotencyKey ?? undefined,
    });
  },
});

type ReplyValues = {
  replyToTweetId?: unknown;
  replyToThreadsId?: unknown;
  replyToUri?: unknown;
  replyToCid?: unknown;
  replyRootUri?: unknown;
  replyRootCid?: unknown;
};
