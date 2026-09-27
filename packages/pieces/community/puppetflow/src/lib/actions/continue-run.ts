import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import { getRun, puppetflowRequest, runPath } from '../common/client';
import { credentialsOf, flowIdDropdown, runIdDropdown } from '../common/props';

export const continueRunAction = createAction({
  auth: puppetflowAuth,
  name: 'continue_run',
  displayName: 'Continue Run',
  description: 'Resume a run paused by $waitHumanValidation()',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Resumes a Puppetflow run that is paused waiting for human validation. The wait ID is read from the run when not provided. Fails if the run is not waiting for validation.',
    idempotent: false,
  },
  props: {
    flowId: flowIdDropdown,
    runId: runIdDropdown,
    waitId: Property.ShortText({
      displayName: 'Wait ID',
      description:
        'UUID of the pending human validation. Leave empty to read it from the run automatically.',
      required: false,
    }),
  },
  async run(context) {
    const { flowId, runId } = context.propsValue;
    const credentials = credentialsOf(context.auth);
    let waitId = context.propsValue.waitId?.trim() ?? '';

    if (waitId.length === 0) {
      const run = await getRun(credentials, flowId, runId);
      if (!run.human_validation_wait_id) {
        throw new Error(`Run ${runId} is not waiting for human validation`);
      }
      waitId = run.human_validation_wait_id;
    }

    return puppetflowRequest({
      credentials,
      method: HttpMethod.POST,
      path: `${runPath(flowId, runId)}/continue`,
      body: { wait_id: waitId },
    });
  },
});
