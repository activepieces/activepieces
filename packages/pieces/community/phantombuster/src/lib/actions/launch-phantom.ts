import { createAction, Property } from '@activepieces/pieces-framework';
import { phantombusterAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentIdDropdown } from '../common/props';
import { outside } from 'semver';

export const launchPhantom = createAction({
  auth: phantombusterAuth,
  name: 'launchPhantom',
  displayName: 'Launch Phantom',
  description: 'Launch a Phantombuster agent and add it to the execution queue',
  props: {
    agentId: agentIdDropdown,
    waitForOutput: Property.Checkbox({
      displayName: 'Wait for Output',
      description:
        'Wait until the agent execution completes and output is available',
      required: false,
      defaultValue: false,
    }),
    argument: Property.Object({
      displayName: 'Argument',
      description: 'Optional argument to pass to the agent',
      required: false,
    }),
    maxRetries: Property.Number({
      displayName: 'Max Retries',
      description: 'Maximum number of retries if the agent fails',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.agentId,
    };

    if (context.propsValue.argument !== undefined) {
      body['argument'] = context.propsValue.argument;
    }

    if (context.propsValue.maxRetries !== undefined) {
      body['maxRetries'] = context.propsValue.maxRetries;
    }

    const launchResponse = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/agents/launch',
      body
    );

    if (context.propsValue.waitForOutput) {
      let output = null;
      const pollInterval = 5000; // 5 seconds

      let isCompleted = false;

      while (!isCompleted) {
        try {
          const outputResponse = await makeRequest(
            context.auth,
            HttpMethod.GET,
            `/agents/fetch-output?id=${context.propsValue.agentId}`,
            undefined
          );
          console.log(outputResponse);
          if (outputResponse) {
            output = outputResponse;
            const status = outputResponse.status;

            if (
              status === 'finished' ||
              status === 'error' ||
              status === 'unknown'
            ) {
              isCompleted = true;
            }
          }
        } catch (error) {
          // Continue polling if output is not yet available
        }

        if (!isCompleted) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      }

      return output;
    }

    return launchResponse;
  },
});
