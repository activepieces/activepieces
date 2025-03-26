import { createAction, Property } from '@activepieces/pieces-framework';
import {
  ExecutionType,
  PauseType,
  STATUS_VARIANT,
} from '@activepieces/shared';
import { listAssignee, sendTodoApproval } from '../utils/utils';

export const createTodoAndWait = createAction({
  name: 'createTodoAndWait',
  displayName: 'Create Todo and Wait',
  description:
    'Creates a todo for a user and wait for their response or take action.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'These details will be displayed for the assignee. Add the full context so they can take proper action, You can also use markdown formatting.',
      required: false,
    }),
    assigneeId: Property.Dropdown({
      displayName: 'Assignee',
      required: false,
      options: async (_, context) => {
        const baseApiUrl = context.server.publicUrl;
        const apiKey = context.server.token;
        const users = await listAssignee(baseApiUrl, apiKey);
        return {
          options: users.data.map((user) => ({
            value: user.id,
            label: `${user.firstName} ${user.lastName}`,
          })),
        };
      },
      refreshers: [],
    }),
    statusOptions: Property.Array({
      displayName: 'Status Options',
      required: true,
      defaultValue: [
        {
          name: 'Accepted',
          variant: STATUS_VARIANT.POSITIVE,
        },
        {
          name: 'Rejected',
          variant: STATUS_VARIANT.NEGATIVE,
        },
      ],
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
        variant: Property.StaticDropdown({
          displayName: 'Variant',
          required: true,
          defaultValue: STATUS_VARIANT.POSITIVE,
          options: {
            options: Object.values(STATUS_VARIANT).map((variant) => ({
              value: variant,
              label: variant,
            })),
          },
        }),
      },
    }),
  },
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
      return {
        status: context.resumePayload.queryParams['status'],
      };
    }
  },
});