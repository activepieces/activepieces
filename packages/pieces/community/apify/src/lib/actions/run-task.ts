import { createAction } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { 
  createApifyClient, 
  createBuildProperty, 
  createRunOptions, 
  handleRunResult, 
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
  displayName: 'Run task',
  description: 'Starts an Apify task run.',
  props: {
    taskid: createTaskIdProperty(),
    input: createTaskInputProperty(),
    build: createBuildProperty(),
    memory: createMemoryProperty(RunType.TASK),
    timeout: createTimeoutProperty(RunType.TASK),
    waitForFinish: createWaitForFinishProperty(RunType.TASK)
  },
  async run(context) {
    const apifyToken = context.auth.apikey;
    const { input, taskid, timeout, build, memory, waitForFinish } = context.propsValue;
    const body = input['body'];

    const client = createApifyClient(apifyToken);

    const runOptions = createRunOptions({ timeout, memory, build });
    const run = await client.task(taskid).call(body, runOptions);

    return handleRunResult(run, waitForFinish || false, client);
  },
});



