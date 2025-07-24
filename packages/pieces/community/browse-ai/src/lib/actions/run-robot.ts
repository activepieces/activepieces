import { createAction, Property } from '@activepieces/pieces-framework';
import { robotIdDropdown } from '../common/props';
import { browseAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const runRobot = createAction({
  auth: browseAiAuth,
  name: 'runRobot',
  displayName: 'Run Robot',
  description: '',
  props: {
    robotId: robotIdDropdown,
    recordVideo: Property.Checkbox({
      displayName: 'Record Video',
      description: 'Whether to record the video of the robot run',
      required: false,
      defaultValue: false,
    }),
    originUrl: Property.ShortText({
      displayName: 'Origin URL',
      description: 'The URL from which the robot is triggered',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    // Action logic here
    const { robotId, recordVideo, originUrl } = propsValue;
    if (!auth || !robotId) {
      throw new Error('Authentication and robot ID are required');
    }
    const requestBody: any = {
      recordVideo: recordVideo || false,
      originUrl: originUrl || '',
    };
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/robots/${robotId}/run`,
      requestBody
    );
    if (!response) {
      throw new Error('Failed to run the robot');
    }
    return {
      message: 'Robot run initiated successfully',
      runDetails: response,
    };
  },
});
