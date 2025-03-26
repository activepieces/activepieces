import { createAction, Property } from '@activepieces/pieces-framework';
import {
  ExecutionType,
  MarkdownVariant,
  STATUS_VARIANT,
} from '@activepieces/shared';
import { listAssignee, sendTodoApproval } from '../utils/utils';

export const createTodo = createAction({
  name: 'createTodo',
  displayName: 'Create Todo',
  description:
    'Creates a todo for a user, requiring them to respond or take action.',
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
      const response = await sendTodoApproval(context, true);
      const links = context.propsValue.statusOptions.map((option: any) => ({
        name: option.name,
        url: `${context.server.publicUrl}v1/todos/${response.body.id}/approve?status=${option.name}&isTest=true`,
      }));
      return {
        id: response.body.id,
        links,
      };
    } else {
      return undefined;
    }
  },
  async run(context) {
    const response = await sendTodoApproval(context, false);
    const links = context.propsValue.statusOptions.map((option: any) => ({
      name: option.name,
      url: `${context.server.publicUrl}v1/todos/${response.body.id}/approve?status=${option.name}`,
    }));
    return {
      id: response.body.id,
      links,
    };
  },
});

