import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import {
  flowPath,
  puppetflowRequest,
  PuppetflowTriggerResponse,
} from '../common/client';
import {
  buildFlowInput,
  credentialsOf,
  flowIdDropdown,
  flowInputsProperty,
} from '../common/props';

export const triggerFlowAction = createAction({
  auth: puppetflowAuth,
  name: 'trigger_flow',
  displayName: 'Trigger Flow',
  description: 'Start a browser automation flow and return immediately',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a new run of a Puppetflow browser automation flow with optional JSON input and returns the run ID without waiting for completion. Each call creates a new run, so retries start the flow again. Use Get Run or Get Run Result to follow the run.',
    idempotent: false,
  },
  props: {
    flowId: flowIdDropdown,
    flowInputs: flowInputsProperty,
    additionalInput: Property.Json({
      displayName: 'Additional Input',
      description:
        'JSON object merged on top of the flow inputs and passed to the flow as $input',
      required: false,
    }),
  },
  async run(context) {
    const { flowId, flowInputs, additionalInput } = context.propsValue;
    const credentials = credentialsOf(context.auth);
    const body = await buildFlowInput({
      credentials,
      flowId,
      flowInputs,
      additionalInput,
    });

    return puppetflowRequest<PuppetflowTriggerResponse>({
      credentials,
      method: HttpMethod.POST,
      path: `${flowPath(flowId)}/trigger`,
      body,
    });
  },
});
