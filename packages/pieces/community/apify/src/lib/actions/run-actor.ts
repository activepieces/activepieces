import { createAction } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import {
  createApifyClient,
  createBuildProperty,
  createRunOptions,
  handleRun,
  createActorSourceProperty,
  createActorIdProperty,
  createActorInputProperty,
  createMemoryProperty,
  createTimeoutProperty,
  createWaitForFinishProperty,
  RunType
} from '../common';

export const runActor = createAction({
  name: 'runActor',
  auth: apifyAuth,
  displayName: 'Run Actor',
  description: 'Runs an Actor and returns all associated details.',
  props: {
    actorSource: createActorSourceProperty(),
    actorid: createActorIdProperty(),
    input: createActorInputProperty(),
    build: createBuildProperty(),
    memory: createMemoryProperty(RunType.ACTOR),
    timeout: createTimeoutProperty(RunType.ACTOR),
    waitForFinish: createWaitForFinishProperty(RunType.ACTOR)
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { input, actorid, timeout, build, memory, waitForFinish } = context.propsValue;
    const body = input['body'];

    const client = createApifyClient(apifyToken);

    const runOptions = createRunOptions({ timeout, memory, build });
    const resourceClient = client.actor(actorid);

    return handleRun({
      resourceClient,
      body,
      runOptions,
      waitForFinish: waitForFinish || false,
      client
    });
  },
});
