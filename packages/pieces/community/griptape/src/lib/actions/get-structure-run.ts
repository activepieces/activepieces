import { createAction, Property } from '@activepieces/pieces-framework';
import { griptapeAuth } from '../common/auth';
import { structureIdDropdown, structureRunsDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getStructureRun = createAction({
  auth: griptapeAuth,
  name: 'getStructureRun',
  displayName: 'Get Structure Run',
  description: 'Get details of a specific structure run',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the details and current status/output of a single existing Griptape Cloud structure run by its run ID. Use to check or retrieve the result of a structure run started elsewhere; requires a known structure run ID. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    structure_id: structureIdDropdown,
    structure_run_id: structureRunsDropdown,
  },
  async run(context) {
    const { structure_run_id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/structure-runs/${structure_run_id}`
    );

    return response;
  },
});
