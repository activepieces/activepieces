import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { kleapRequest, waitForTask } from '../common/client';
import { waitProps } from '../common/props';

const taskIdProp = () =>
  Property.ShortText({
    displayName: 'Task ID',
    description: 'The task_id returned by Create App or Edit App With AI.',
    required: true,
  });

export const getTask = createAction({
  auth: kleapAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description:
    'Returns the status of an AI task (queued, running, completed, failed) and its result: response, preview and production URLs, files changed, credits charged.',
  props: {
    task_id: taskIdProp(),
    ...waitProps(9, false),
  },
  async run(context) {
    const p = context.propsValue;
    const taskId = p.task_id.trim();
    // "Get Task" is a status read first: waiting is opt-in here, unlike on Create / Edit.
    if (p.wait_for_completion !== true) {
      return kleapRequest(context.auth, HttpMethod.GET, `/tasks/${encodeURIComponent(taskId)}`);
    }
    return waitForTask(context.auth, taskId, p.timeout_minutes ?? 9);
  },
});

export const retryTask = createAction({
  auth: kleapAuth,
  name: 'retry_task',
  displayName: 'Retry Task',
  description: 'Restarts a failed AI task, resuming from the files it already wrote. Returns the new task.',
  props: {
    task_id: taskIdProp(),
    ...waitProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const retried = await kleapRequest(context.auth, HttpMethod.POST, `/tasks/${encodeURIComponent(p.task_id.trim())}/retry`);
    if (p.wait_for_completion === false) return retried;
    const task = await waitForTask(context.auth, retried['task_id'] as string, p.timeout_minutes ?? 9);
    return { ...retried, ...task };
  },
});
