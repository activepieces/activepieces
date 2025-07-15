import { createAction } from '@activepieces/pieces-framework';
import {
  ExecutionType,
  PauseType,
  CreateAndWaitTodoResult,
} from '@activepieces/shared';
import { sendTodoApproval, createTodoProps } from '../utils/utils';

export const createTodoAndWait = createAction({
  name: 'createTodoAndWait',
  displayName: 'Create Todo and Wait',
  description:
    'Creates a todo for a user and wait for their response or take action.',
  props: createTodoProps,
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async test(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });
      const response = await sendTodoApproval(context, true);
      return response.body;
    } else {
      return {
        status: context.resumePayload.queryParams['status'],
        message: context.resumePayload.queryParams['message'] ?? 'Sample message',
      };
    }
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });
      const response = await sendTodoApproval(context, false);
      return response.body;
    } else {
      const result: CreateAndWaitTodoResult = {
        status: context.resumePayload.queryParams['status'],
        message: context.resumePayload.queryParams['message'],
      }
      return result;
    }
  },
});