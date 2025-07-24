import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { browseAiApiCall } from '../common/client';
import { browseAiAuth } from '../common/auth';
import { robotIdDropdown } from '../common/props';

export const runRobotAction = createAction({
  name: 'run-robot',
  auth: browseAiAuth,
  displayName: 'Run a Robot',
  description:
    'Run a robot on-demand with custom input parameters. The captured data will be sent via webhook or can be fetched using the task ID.',
  props: {
    robotId: robotIdDropdown,
    recordVideo: Property.Checkbox({
      displayName: 'Record Video',
      description:
        'Try to record a video while running the task (not guaranteed).',
      required: false,
      defaultValue: false,
    }),
    inputStringParam: Property.ShortText({
      displayName: 'String Parameter',
      description: 'A string input parameter to override default robot value.',
      required: false,
    }),
    inputNumberParam: Property.Number({
      displayName: 'Number Parameter',
      description: 'A number input parameter to override default robot value.',
      required: false,
    }),
    inputArrayParam: Property.Array({
      displayName: 'Array Parameter',
      description: 'An array of strings to override a list-type robot input.',
      required: false,
    }),
  },
  async run(context) {
    const {
      robotId,
      recordVideo,
      inputStringParam,
      inputNumberParam,
      inputArrayParam,
    } = context.propsValue;

    const inputParameters: Record<string, any> = {};

    if (inputStringParam) inputParameters['stringParam'] = inputStringParam;
    if (inputNumberParam !== undefined)
      inputParameters['numberParam'] = inputNumberParam;
    if (inputArrayParam && inputArrayParam.length > 0) {
      inputParameters['arrayParam'] = inputArrayParam;
    }

    try {
      const response = await browseAiApiCall({
        method: HttpMethod.POST,
        resourceUri: `/robots/${robotId}/tasks`,
        auth: { apiKey: context.auth as string },
        body: {
          recordVideo: recordVideo || false,
          inputParameters,
        },
      });

      const typedResponse = response as {
        taskId: string;
        robotId: string;
        status: string;
        [key: string]: any;
      };

      return {
        success: true,
        message: 'Robot run successfully',
        taskId: typedResponse.taskId,
        robotId: typedResponse.robotId,
        status: typedResponse.status,
        response: typedResponse,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }

      if (error.response?.status === 404) {
        throw new Error('Robot not found. Please verify the robot ID.');
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before retrying.');
      }

      throw new Error(
        `Failed to run robot: ${error.message || 'Unknown error occurred'}`
      );
    }
  },
});
