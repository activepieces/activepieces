import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { griptapeAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { assistantIdDropdown, assistantRunsDropdown } from '../common/props';

export const getAssistantRun = createAction({
  auth: griptapeAuth,
  name: 'getAssistantRun',
  displayName: 'Get Assistant Run',
  description: 'Get details of a specific assistant run',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the details and current status/output of a single existing Griptape Cloud assistant run by its run ID. Use to check or retrieve the result of a run started elsewhere; requires a known assistant run ID. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    assistant_id: assistantIdDropdown,
    assistant_run_id: assistantRunsDropdown,
  },
  async run(context) {
    const { assistant_run_id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/assistant-runs/${assistant_run_id}`
    );

    return response;
  },
});
