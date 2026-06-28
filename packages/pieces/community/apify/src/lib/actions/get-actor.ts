import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetActor = createAction({
  name: 'apify_get_actor',
  auth: apifyAuth,
  displayName: 'Get Actor',
  description: 'Retrieves metadata for a single Apify Actor by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get metadata for one Actor by its ID (name, default run options, stats, versions). Use after Find Actor to inspect an actor\'s details before running it. To discover an actor by name use Find Actor; to get its input fields use Get Actor Input Schema. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    actorId: Property.ShortText({
      displayName: 'Actor ID',
      description:
        'The ID (or "username~actor-name") of the Actor. Obtain it from Find Actor or List Actors.',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { actorId } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const actor = await client.actor(actorId).get();
      if (!actor) {
        throw new Error(
          `Actor "${actorId}" not found. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      return actor;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading actor "${actorId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Actor "${actorId}" not found. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get actor: ${error.message || error}`);
    }
  },
});
