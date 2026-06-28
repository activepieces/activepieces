import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetActorInputSchema = createAction({
  name: 'apify_get_actor_input_schema',
  auth: apifyAuth,
  displayName: 'Get Actor Input Schema',
  description: 'Retrieves the input schema (fields, types, required, enums) of an Actor\'s default build.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the raw input schema of an Actor\'s default build — field names, types, required flags, enums and prefill defaults. Use this before Run Actor to build a correct input JSON body and avoid HTTP 400 errors from guessed field names. Resolve the actor ID with Find Actor first. Read-only and idempotent.',
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
      const defaultBuild = await client.actor(actorId).defaultBuild();
      const build: any = await defaultBuild.get();

      if (!build) {
        throw new Error(
          `No default build found for actor "${actorId}". The actor may not be built yet.`
        );
      }

      const input = build.actorDefinition?.input ?? null;

      return {
        actorId,
        buildId: build.id,
        buildNumber: build.buildNumber,
        input,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading actor "${actorId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Actor "${actorId}" or its default build not found. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get actor input schema: ${error.message || error}`);
    }
  },
});
