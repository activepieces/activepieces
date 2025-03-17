import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const createTask = createAction({
  name: 'createTask',
  displayName: 'Create Task',
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
        color: Property.Color({
          displayName: 'Color',
          required: true,
        }),
        textColor: Property.Color({
          displayName: 'Text Color',
          required: true,
        }),
      },
    }),
  },
  async run({ propsValue, flows, run, server }) {
    try {
        const requestBody = {
          title: propsValue.title,
          description: propsValue.description ?? undefined,
          statusOptions: propsValue.statusOptions.map((option: any) => ({
            name: option.name,
            description: option.description,
            color: option.color,
            textColor: option.textColor,
          })),
          flowId: flows.current.id,
          runId: run.id,
          assigneeId: propsValue.assigneeId ?? undefined,
      };
      

      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${server.publicUrl}v1/manual-tasks`,
        body: requestBody,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: server.token,
        },
      };

      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error) {
      console.error('Error while creating task', error);
      throw error;
    }
  },
});
