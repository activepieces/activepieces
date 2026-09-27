import { createAction } from '@activepieces/pieces-framework';
import { puppetflowAuth } from '../auth';
import { getRun } from '../common/client';
import {
  credentialsOf,
  flowIdDropdown,
  includeCodeCheckbox,
  includeLogsCheckbox,
  runIdDropdown,
} from '../common/props';

export const getRunAction = createAction({
  auth: puppetflowAuth,
  name: 'get_run',
  displayName: 'Get Run',
  description: 'Get the full details of a run, including status and artifacts',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the full details of a Puppetflow run: status, output, error message, duration, human validation state, and artifact links. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: flowIdDropdown,
    runId: runIdDropdown,
    includeLogs: includeLogsCheckbox,
    includeCode: includeCodeCheckbox,
  },
  async run(context) {
    const { flowId, runId, includeLogs, includeCode } = context.propsValue;
    return getRun(credentialsOf(context.auth), flowId, runId, {
      logs: includeLogs ? 1 : undefined,
      code: includeCode ? 1 : undefined,
    });
  },
});
