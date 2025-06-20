import { HttpMethod, AuthenticationType, HttpRequest, httpClient } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";
import { CreateTodoRequestBody, PopulatedTodo, SeekPage, STATUS_VARIANT,  UserWithMetaInformation } from "@activepieces/shared";


export const createTodoProps = {
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
        continueFlow: true,
      },
      {
        name: 'Rejected',
        variant: STATUS_VARIANT.NEGATIVE,
        continueFlow: true,
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
      continueFlow: Property.Checkbox({
        displayName: 'Continue Flow',
        required: true,
        defaultValue: true,
      }),
    },
  }),
}

export function constructTodoUrl(publicUrl: string, todoId: string, status: string, isTest: boolean) {
  return `${publicUrl}v1/todos/${todoId}/resolve?status=${status}&isTest=${isTest}`;
}

type ApprovalParms = {
  propsValue: {
    title: string;
    description?: string;
    statusOptions: unknown[];
    assigneeId?: string;
  };
  flows: {
    current: {
      id: string;
    };
  };
  run: {
    id: string;
  };
  server: {
    publicUrl: string;
    token: string;
  };
  generateResumeUrl: (options: { queryParams: Record<string, any> }) => string;
}
export async function sendTodoApproval(context: ApprovalParms, isTest: boolean) {
  const requestBody: CreateTodoRequestBody = {
    title: context.propsValue.title,
    description: context.propsValue.description ?? '',
    statusOptions: context.propsValue.statusOptions.map((option: any) => ({
      name: option.name,
      description: option.description,
      variant: option.variant,
      continueFlow: option.continueFlow,
    })),
    flowId: context.flows.current.id,
    runId: isTest ? undefined : context.run.id,
    assigneeId: context.propsValue.assigneeId ?? undefined,
    resolveUrl: context.generateResumeUrl({
      queryParams: {},
    }),
  };
  return await httpClient.sendRequest<PopulatedTodo>({
    method: HttpMethod.POST,
    url: `${context.server.publicUrl}v1/todos`,
    body: requestBody,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: context.server.token,
    },
  });
}

export async function listAssignee(
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
