import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { findActorActionOutputSchema } from '../output-schemas';

export const apifyFindActor = createAction({
  name: 'apify_find_actor',
  auth: apifyAuth,
  displayName: 'Find Actor',
  description: 'Searches the public Apify Store for Actors by name or keyword.',
  audience: 'ai',
  outputSchema: findActorActionOutputSchema,
  aiMetadata: {
    description:
      'Search the public Apify Store by name/keyword and return matching Actors with their IDs. This is the primary resolver: use it to turn an actor name into the actor ID required by Run Actor, Get Actor Input Schema, and other actor operations. Use List Actors instead to list your account\'s OWN actors. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Name or keyword to search the Apify Store for (e.g. "instagram scraper"). Leave empty to list popular store actors.',
      required: false,
    }),
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
    const { search, limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.store().list({
        search: search || undefined,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      const actors = response.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        username: item.username,
        title: item.title,
        fullName:
          item.username && item.name
            ? `${item.username}/${item.name}`
            : item.name,
        description: item.description,
        stats: item.stats,
      }));

      return {
        actors,
        count: actors.length,
        total: response.total,
      };
    } catch (error: any) {
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to search the Apify Store: ${error.message || error}`);
    }
  },
});
