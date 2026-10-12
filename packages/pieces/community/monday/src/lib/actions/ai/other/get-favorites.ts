import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { getFavoritesActionOutputSchema } from '../../../output-schemas';

export const getFavoritesAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_favorites',
  classification: 'SEARCH',
  displayName: 'Get Favorites',
  description: 'Lists the connected user\'s favorite boards, dashboards and docs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the monday.com favorites of the user who owns the API token, each with the favorited object\'s ID and type (e.g. Board, Overview for dashboards, Document). Use to find the boards and docs the user works with most. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getFavoritesActionOutputSchema,
  props: {},
  async run(context) {
    const data = await makeClient(context.auth).query<{ favorites: (MondayFavorite | null)[] | null }>({
      query: `query {
        favorites {
          id
          position
          folderId
          createdAt
          updatedAt
          object { id type }
        }
      }`,
    });

    const favorites = (data.favorites ?? [])
      .filter((f): f is MondayFavorite => f !== null)
      .map((f) => ({
        id: f.id ?? null,
        object_id: f.object?.id ?? null,
        object_type: f.object?.type ?? null,
        folder_id: f.folderId ?? null,
        position: f.position ?? null,
        created_at: f.createdAt ?? null,
        updated_at: f.updatedAt ?? null,
      }));

    return { favorites, count: favorites.length };
  },
});

type MondayFavorite = {
  id: string | null;
  position: number | null;
  folderId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  object: { id: string; type: string } | null;
};
