import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  ExecutionType,
  MarkdownVariant,
  PauseType,
  SeekPage,
  STATUS_VARIANT,
  UserWithMetaInformation,
} from '@activepieces/shared';

const routerMarkdown = `
Use the **Router piece** to create different paths based on the todo's status.
`;

export const createTodo = createAction({
  name: 'createTodo',
  displayName: 'Create Todo',
  description:
    'Creates a todo for a user, requiring them to respond or take action.',
  props: {
    routerMarkdown: Property.MarkDown({
      value: routerMarkdown,
      variant: MarkdownVariant.INFO,
    }),
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
        console.log('HELLLOOOO');
        console.log(JSON.stringify(users, null, 2));
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

async function sendTodoApproval(context: any, isTest: boolean) {
  const requestBody = {
    title: context.propsValue.title,
    description: context.propsValue.description ?? undefined,
    statusOptions: context.propsValue.statusOptions.map((option: any) => ({
      name: option.name,
      description: option.description,
      variant: option.variant,
    })),
    flowId: context.flows.current.id,
    runId: isTest ? undefined : context.run.id,
    assigneeId: context.propsValue.assigneeId ?? undefined,
    approvalUrl: context.generateResumeUrl({
      queryParams: { action: 'approve' },
    }),
  };

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${context.server.publicUrl}v1/todos`,
    body: requestBody,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: context.server.token,
    },
  };

  return await httpClient.sendRequest(request);
}

async function listAssignee(
  publicUrl: string,
  token: string
): Promise<SeekPage<UserWithMetaInformation>> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${publicUrl}v1/todos/assignees`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token,
    },
  };
  const res = await httpClient.sendRequest<SeekPage<UserWithMetaInformation>>(
    request
  );
  return res.body;
}
