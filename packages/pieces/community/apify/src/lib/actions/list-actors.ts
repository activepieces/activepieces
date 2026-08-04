import { createAction, Property } from '@activepieces/pieces-framework';
import { ActorListSortBy } from 'apify-client';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { listActorsActionOutputSchema } from '../output-schemas';

export const apifyListActors = createAction({
  name: 'apify_list_actors',
  auth: apifyAuth,
  displayName: 'List Actors',
  description: 'Lists the Actors owned by the authenticated account.',
  audience: 'ai',
  outputSchema: listActorsActionOutputSchema,
  aiMetadata: {
    description:
      'List the account\'s OWN Actors (id, name, username) so you can resolve an actor ID without a dropdown. Use this for actors the account owns; use Find Actor to search the PUBLIC Apify Store. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of actors to return. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of actors to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.actors().list({
        my: true,
        desc: true,
        sortBy: ActorListSortBy.LAST_RUN_STARTED_AT,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      const actors = response.items.map((item) => ({
        id: item.id,
        name: item.name,
        username: item.username,
        fullName: `${item.username}/${item.name}`,
        createdAt: item.createdAt,
        modifiedAt: item.modifiedAt,
      }));

      return {
        actors,
        count: actors.length,
        total: response.total,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error('Permission denied listing your actors.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list actors: ${error.message || error}`);
    }
  },
});
