import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

const EMOJI_PATTERN = /^:[a-z0-9_+-]{1,64}:(?::skin-tone-[2-6]:)?$/;

export const listCommentReactionsAction = createAction({
  auth: figmaAuth,
  name: 'list_comment_reactions',
  classification: 'SEARCH',
  displayName: 'List Comment Reactions',
  description: 'Lists the emoji reactions on a comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists emoji reactions on one Figma comment as {items, nextCursor, hasMore}; each item has emoji (shortcode like :heart:), user and created_at. Pass nextCursor back as Cursor for more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.listReactions,
  props: {
    file_key: figmaProps.fileKey(),
    comment_id: figmaProps.commentId('The comment whose reactions to list.'),
    cursor: figmaProps.cursor,
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: reactionsPath({ fileKey, commentId: context.propsValue.comment_id }),
      query: { cursor: figmaClient.optionalText(context.propsValue.cursor) },
      scope: 'file_comments:read',
      tier: 2,
      operation: 'list the comment reactions',
    });
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    const items = Array.isArray(body['reactions']) ? body['reactions'] : [];
    const pagination = figmaClient.isRecord(body['pagination']) ? body['pagination'] : {};
    const nextCursor = items.length > 0 ? figmaClient.cursorFromNextPage({ nextPage: pagination['next_page'], param: 'cursor' }) : null;
    return { items, nextCursor, hasMore: nextCursor !== null };
  },
});

export const addCommentReactionAction = createAction({
  auth: figmaAuth,
  name: 'add_comment_reaction',
  classification: 'WRITE',
  displayName: 'Add Comment Reaction',
  description: 'Adds an emoji reaction to a comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds an emoji reaction (shortcode like :heart: or :+1:) from the connected user to a Figma comment. Idempotent: reacting again with the same emoji keeps one reaction.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.addReaction,
  props: {
    file_key: figmaProps.fileKey(),
    comment_id: figmaProps.commentId('The comment to react to.'),
    emoji: emojiProp(),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const emoji = parseEmoji(context.propsValue.emoji);
    const path = reactionsPath({ fileKey, commentId: context.propsValue.comment_id });
    await figmaClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path,
      body: { emoji },
      scope: 'file_comments:write',
      tier: 2,
      operation: 'add the reaction',
    });
    return { added: true, fileKey, commentId: String(context.propsValue.comment_id).trim(), emoji };
  },
});

export const removeCommentReactionAction = createAction({
  auth: figmaAuth,
  name: 'remove_comment_reaction',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Comment Reaction',
  description: 'Removes your emoji reaction from a comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the connected user\'s emoji reaction (shortcode like :heart:) from a Figma comment. Only your own reactions can be removed.',
    idempotent: false,
  },
  outputSchema: figmaOutputSchemas.removeReaction,
  props: {
    file_key: figmaProps.fileKey(),
    comment_id: figmaProps.commentId('The comment to remove the reaction from.'),
    emoji: emojiProp(),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const emoji = parseEmoji(context.propsValue.emoji);
    await figmaClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: reactionsPath({ fileKey, commentId: context.propsValue.comment_id }),
      query: { emoji },
      scope: 'file_comments:write',
      tier: 2,
      operation: 'remove the reaction',
    });
    return { removed: true, fileKey, commentId: String(context.propsValue.comment_id).trim(), emoji };
  },
});

function emojiProp() {
  return Property.ShortText({
    displayName: 'Emoji',
    description: 'Emoji shortcode with colons, e.g. :heart:, :+1: or :eyes:.',
    required: true,
  });
}

function parseEmoji(value: unknown): string {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const withColons = text !== '' && !text.startsWith(':') ? `:${text}:` : text;
  if (!EMOJI_PATTERN.test(withColons)) {
    throw new Error('Emoji must be a shortcode like :heart: or :+1:.');
  }
  return withColons;
}

function reactionsPath({ fileKey, commentId }: { fileKey: string; commentId: unknown }): string {
  return `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}/comments/${figmaClient.segment({ value: commentId, label: 'Comment ID' })}/reactions`;
}
