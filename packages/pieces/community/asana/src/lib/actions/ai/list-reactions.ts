import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaProps } from '../../common/client';

export const asanaListReactionsAction = createAction({
  auth: asanaAuth,
  name: 'list_reactions',
  classification: 'SEARCH',
  displayName: 'List Reactions',
  description: 'List who reacted with a given emoji on an Asana comment or status update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the reactions with one emoji on a story (such as a task comment) or a status update, including who reacted. The emoji is required: Asana only returns reactions for the emoji you name. Get story gids from List Task Stories and status update gids from List Status Updates. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    target: Property.ShortText({
      displayName: 'Story or Status Update GID',
      description: 'Gid of the story (for example a task comment) or status update. Obtain it from List Task Stories or List Status Updates.',
      required: true,
    }),
    emoji_base: Property.ShortText({
      displayName: 'Emoji',
      description: 'The emoji character itself, not a name or shortcode, for example the thumbs-up character (U+1F44D). Use the base emoji without a skin-tone variant.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'reactions' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { target, emoji_base, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/reactions',
      operation: 'List Reactions',
      query: { target: target.trim(), emoji_base: emoji_base.trim() },
      limit,
      offset,
    });
  },
});
