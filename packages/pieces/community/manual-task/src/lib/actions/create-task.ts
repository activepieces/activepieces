import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { ExecutionType, PauseType, STATUS_VARIANT } from '@activepieces/shared';

export const createTask = createAction({
  name: 'createTask',
  displayName: 'Create Task and Wait for Approval',
  description: 'Creates a task for a user, requiring them to respond or take action.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the task',
      required: false,
    }),
    assigneeId: Property.Dropdown({
      displayName: 'Assignee',
      description: 'The user to assign the task to',
      required: false,
      options: async (_, context) => {
        const baseApiUrl = context.server.publicUrl;
        const apiKey = context.server.token;
        // TODO: need to make it get all pages and make the limit 100 not 1 page with all members
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${baseApiUrl}v1/project-members`,
          queryParams: {
            limit: '1000',
            projectId: context.project.id,
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: apiKey,  
          }
        };
        const res = await httpClient.sendRequest(request);
        if (res.status === 200) {
          return {
            options: res.body.data.map((projectMember: any) => ({
              value: projectMember.user.id,
              label: `${projectMember.user.firstName} ${projectMember.user.lastName}`,
            })),
          };
        }
        return {
          options: [],
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
        description: Property.ShortText({
          displayName: 'Description',
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
          response: {}
        }
      });
      const response = await sendTaskApproval(context, true);
      const publicUrlWithoutAPI = context.server.publicUrl.replace('/api', '');
      return {
        url: `${publicUrlWithoutAPI}projects/${context.project.id}/manual-tasks/${response.body.id}`
      };
    } else {
      return {
        status: context.resumePayload.queryParams['status']
      };
    }
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
        context.run.pause({
          pauseMetadata: {
            type: PauseType.WEBHOOK,
            response: {}
          }
        });
        await sendTaskApproval(context, false);
        return {
          success: true,
        };
    } else {
      return {
        status: context.resumePayload.queryParams['status']
      };
    }
  },
});

async function sendTaskApproval(context: any, isTest: boolean) {
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
        queryParams: { action: 'approve' }
      }),
  };

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${context.server.publicUrl}v1/manual-tasks`,
    body: requestBody,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: context.server.token
    }
  };

  return await httpClient.sendRequest(request);
}