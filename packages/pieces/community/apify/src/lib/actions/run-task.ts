import { createAction } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import {
  createApifyClient,
  createBuildProperty,
  createRunOptions,
  handleRun,
  createTaskIdProperty,
  createTaskInputProperty,
  createMemoryProperty,
  createTimeoutProperty,
  createWaitForFinishProperty,
  RunType
} from '../common';

export const runTask = createAction({
  name: 'runTask',
  auth: apifyAuth,
  displayName: 'Run Task',
  description: 'Runs an Actor task and returns all associated details.',
  props: {
    taskid: createTaskIdProperty(),
    input: createTaskInputProperty(),
    build: createBuildProperty(),
    memory: createMemoryProperty(RunType.TASK),
    timeout: createTimeoutProperty(RunType.TASK),
    waitForFinish: createWaitForFinishProperty(RunType.TASK)
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { input, taskid, timeout, build, memory, waitForFinish } = context.propsValue;
    const body = input['body'];

    const client = createApifyClient(apifyToken);

    const runOptions = createRunOptions({ timeout, memory, build });
    const resourceClient = client.task(taskid);

    return handleRun({
      resourceClient,
      body,
      runOptions,
      waitForFinish: waitForFinish || false,
      client
    });
  },
});



