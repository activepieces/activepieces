import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyCreateTask = createAction({
  name: 'apify_create_task',
  auth: apifyAuth,
  displayName: 'Create Task',
  description: 'Creates a new saved Actor task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new saved Actor task — a reusable, named Actor configuration with stored input. Use this to set up a task an agent or flow can run repeatedly with Run Task. Resolve the actor ID with Find Actor or List Actors, and build the input from Get Actor Input Schema. Not idempotent — each call creates a new task and a duplicate name errors.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'Unique name for the task (within your account). Creation fails if the name is already taken.',
      required: true,
    }),
    actorId: Property.ShortText({
      displayName: 'Actor ID',
      description:
        'The ID (or "username~actor-name") of the Actor this task wraps. Obtain it from Find Actor or List Actors.',
      required: true,
    }),
    input: Property.Json({
      displayName: 'Input JSON',
      description:
        'The JSON input body to store on the task. Match the Actor\'s input schema (see Get Actor Input Schema).',
      required: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { name, actorId, input } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const task = await client.tasks().create({
        name,
        actId: actorId,
        input: (input ?? undefined) as Record<string, unknown> | undefined,
      });
      return task;
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw new Error(
          `Failed to create task — the name "${name}" may already be taken or the actor ID is invalid: ${error.message || error}`
        );
      }
      if (error.statusCode === 403) {
        throw new Error(
          'Permission denied creating a task. Your account may not be able to author tasks.'
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
      throw new Error(`Failed to create task: ${error.message || error}`);
    }
  },
});
