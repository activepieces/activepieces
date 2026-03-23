import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { manusAuth } from '../common/auth';

export const createTask = createAction({
  name: 'create_task',
  auth: manusAuth,
  displayName: 'Create Task',
  description: 'Create a new task for Manus AI to execute',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The task prompt or instruction for the Manus agent',
      required: true,
    }),
    agentProfile: Property.StaticDropdown({
      displayName: 'Agent Profile',
      description: 'The AI model profile to use for the task',
      required: true,
      defaultValue: 'manus-1.5',
      options: {
        options: [
          {
            label: 'Manus 1.5 (Recommended)',
            value: 'manus-1.5',
          },
          {
            label: 'Manus 1.5 Lite (Faster)',
            value: 'manus-1.5-lite',
          },
          {
            label: 'Speed (Deprecated)',
            value: 'speed',
          },
          {
            label: 'Quality (Deprecated)',
            value: 'quality',
          },
        ],
      },
    }),
    taskMode: Property.StaticDropdown({
      displayName: 'Task Mode',
      description: 'The interaction mode for the task',
      required: false,
      options: {
        options: [
          {
            label: 'Chat',
            value: 'chat',
          },
          {
            label: 'Adaptive',
            value: 'adaptive',
          },
          {
            label: 'Agent',
            value: 'agent',
          },
        ],
      },
    }),
    connectors: Property.Array({
      displayName: 'Connectors',
      description: 'List of connector IDs to enable for this task',
      required: false,
    }),
    hideInTaskList: Property.Checkbox({
      displayName: 'Hide in Task List',
      description: 'Whether to hide this task from the Manus webapp task list',
      required: false,
      defaultValue: false,
    }),
    createShareableLink: Property.Checkbox({
      displayName: 'Create Shareable Link',
      description: 'Whether to make the chat publicly accessible to others on the Manus website',
      required: false,
      defaultValue: false,
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'For continuing existing tasks (multi-turn conversations)',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Your default locale that you\'ve set on Manus (e.g., "en-US", "zh-CN")',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'Array of file/image attachments (URLs or base64 data)',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, any> = {
      prompt: context.propsValue['prompt'],
      agentProfile: context.propsValue['agentProfile'],
    };

    if (context.propsValue['taskMode']) {
      body['taskMode'] = context.propsValue['taskMode'];
    }
    if (context.propsValue['connectors'] && context.propsValue['connectors'].length > 0) {
      body['connectors'] = context.propsValue['connectors'];
    }
    if (context.propsValue['hideInTaskList'] !== undefined) {
      body['hideInTaskList'] = context.propsValue['hideInTaskList'];
    }
    if (context.propsValue['createShareableLink'] !== undefined) {
      body['createShareableLink'] = context.propsValue['createShareableLink'];
    }
    if (context.propsValue['taskId']) {
      body['taskId'] = context.propsValue['taskId'];
    }
    if (context.propsValue['locale']) {
      body['locale'] = context.propsValue['locale'];
    }
    if (context.propsValue['attachments'] && context.propsValue['attachments'].length > 0) {
      body['attachments'] = context.propsValue['attachments'];
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manus.ai/v1/tasks',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'API_KEY': context.auth.secret_text,
      },
      body,
    });

    return response.body;
  },
});
