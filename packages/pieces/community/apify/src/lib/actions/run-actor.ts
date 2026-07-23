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
  audience: 'both',
  aiMetadata: { description: 'Starts an Apify Actor (a hosted scraper/automation program) by actor ID, passing a JSON input body and optional build/memory/timeout settings. Use this to execute a specific Actor for scraping or data extraction; set waitForFinish to block until the run completes and fetch its dataset items. Not idempotent — each call launches a new actor run.', idempotent: false },
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
