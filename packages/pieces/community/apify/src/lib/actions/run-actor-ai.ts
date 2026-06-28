import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import {
  createApifyClient,
  createRunOptions,
  handleRun,
} from '../common';

export const apifyRunActor = createAction({
  name: 'apify_run_actor',
  auth: apifyAuth,
  displayName: 'Run Actor',
  description: 'Starts an Apify Actor by ID and optionally waits for it to finish.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Run an Apify Actor (a hosted scraper/automation program) by its actor ID, passing a JSON input body. Resolve the actor ID with Find Actor (public store) or List Actors (your own), and build the input body from Get Actor Input Schema. Prefer Run Task when the user has a saved, pre-configured task. Set waitForFinish=true only for short runs (it blocks server-side up to ~60s); for long scrapes leave it false and poll with Get Actor Run. Not idempotent — each call launches a new run.',
    idempotent: false,
  },
  props: {
    actorId: Property.ShortText({
      displayName: 'Actor ID',
      description:
        'The ID (or "username~actor-name") of the Actor to run. Obtain it from Find Actor (public Apify Store search) or List Actors (your account\'s own actors).',
      required: true,
    }),
    input: Property.Json({
      displayName: 'Input JSON',
      description:
        'JSON input body for the run. Get the field names/types/required from Get Actor Input Schema for this actor. If omitted, the Actor uses the input from its default run configuration.',
      required: false,
    }),
    build: Property.ShortText({
      displayName: 'Build',
      description:
        'Build to run — a build tag or build number. Defaults to the build in the Actor\'s default run configuration (typically "latest").',
      required: false,
    }),
    memory: Property.Number({
      displayName: 'Memory (MB)',
      description:
        'Memory limit for the run in megabytes (e.g. 256, 1024, 4096). Defaults to the Actor\'s default run configuration.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description:
        'Optional timeout for the run in seconds. Defaults to the Actor\'s default run configuration.',
      required: false,
    }),
    waitForFinish: Property.Checkbox({
      displayName: 'Wait for finish',
      description:
        'If true, block until the run finishes (server-side, capped ~60s) and return its dataset items. For long runs leave false and poll with Get Actor Run.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { actorId, input, timeout, build, memory, waitForFinish } =
      context.propsValue;

    const client = createApifyClient(apifyToken);

    const runOptions = createRunOptions({ timeout, memory, build });
    const resourceClient = client.actor(actorId);

    try {
      return await handleRun({
        resourceClient,
        body: (input ?? {}) as Record<string, unknown>,
        runOptions,
        waitForFinish: waitForFinish || false,
        client,
      });
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(
          `Permission denied running actor "${actorId}". Your account may not have access to this actor or has hit a plan limit.`
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Actor "${actorId}" not found. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to run actor: ${error.message || error}`);
    }
  },
});
