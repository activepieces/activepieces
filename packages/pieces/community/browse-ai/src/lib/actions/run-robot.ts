import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { browseAiApiCall } from '../common/client';
import { browseAiAuth } from '../common/auth';
import { robotIdDropdown, robotParameters } from '../common/props';

export const runRobotAction = createAction({
  name: 'run-robot',
  auth: browseAiAuth,
  displayName: 'Run a Robot',
  description:
    'Runs a robot on-demand with custom input parameters.',
  props: {
    robotId: robotIdDropdown,
    recordVideo: Property.Checkbox({
      displayName: 'Record Video',
      description:
        'Try to record a video while running the task.',
      required: false,
      defaultValue: false,
    }),
    robotParams: robotParameters,
  },
  async run(context) {
    const { robotId, recordVideo } = context.propsValue;

    const inputParameters = context.propsValue.robotParams ?? {};

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

      return response;
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
