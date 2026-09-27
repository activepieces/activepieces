import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import {
  flowPath,
  getRun,
  puppetflowRequest,
  PuppetflowTriggerResponse,
  TERMINAL_RUN_STATUSES,
} from '../common/client';
import {
  buildFlowInput,
  credentialsOf,
  flowIdDropdown,
  flowInputsProperty,
} from '../common/props';

const DEFAULT_POLL_INTERVAL_SECONDS = 5;
const DEFAULT_TIMEOUT_SECONDS = 300;
const MAX_TIMEOUT_SECONDS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const triggerFlowAndWaitAction = createAction({
  auth: puppetflowAuth,
  name: 'trigger_flow_and_wait',
  displayName: 'Trigger Flow and Wait',
  description:
    'Start a browser automation flow and wait until the run completes',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a new run of a Puppetflow browser automation flow, polls its status, and returns the completed run including its output. Each call creates a new run, so retries start the flow again. Fails if the run does not finish before the timeout.',
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
    pollIntervalSeconds: Property.Number({
      displayName: 'Polling Interval (seconds)',
      description: 'How often to check whether the run has completed',
      required: false,
      defaultValue: DEFAULT_POLL_INTERVAL_SECONDS,
    }),
    timeoutSeconds: Property.Number({
      displayName: 'Timeout (seconds)',
      description: `Maximum time to wait for the run, up to ${MAX_TIMEOUT_SECONDS} seconds`,
      required: false,
      defaultValue: DEFAULT_TIMEOUT_SECONDS,
    }),
    includeLogs: Property.Checkbox({
      displayName: 'Include Console Logs',
      description: 'Include console_logs in the returned run',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      flowId,
      flowInputs,
      additionalInput,
      pollIntervalSeconds,
      timeoutSeconds,
      includeLogs,
    } = context.propsValue;
    const credentials = credentialsOf(context.auth);

    const pollIntervalMs =
      Math.max(1, pollIntervalSeconds ?? DEFAULT_POLL_INTERVAL_SECONDS) * 1000;
    const timeoutMs =
      Math.min(
        MAX_TIMEOUT_SECONDS,
        Math.max(1, timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS)
      ) * 1000;

    const body = await buildFlowInput({
      credentials,
      flowId,
      flowInputs,
      additionalInput,
    });

    const triggered = await puppetflowRequest<PuppetflowTriggerResponse>({
      credentials,
      method: HttpMethod.POST,
      path: `${flowPath(flowId)}/trigger`,
      body,
    });

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      await sleep(pollIntervalMs);
      const run = await getRun(credentials, flowId, triggered.run_id, {
        logs: includeLogs ? 1 : undefined,
      });
      if (TERMINAL_RUN_STATUSES.includes(run.status)) {
        return run;
      }
    }

    throw new Error(
      `Run ${triggered.run_id} of flow ${flowId} did not complete within ${
        timeoutMs / 1000
      } seconds`
    );
  },
});
