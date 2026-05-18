import { createAction, Property } from '@activepieces/pieces-framework';
import { griptapeAuth } from '../common/auth';
import { structureIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createStructureRun = createAction({
  auth: griptapeAuth,
  name: 'createStructureRun',
  displayName: 'Create Structure Run',
  description: 'Create a run for a structure and wait for completion',
  props: {
    structure_id: structureIdDropdown,
    input_args: Property.Array({
      displayName: 'Input Arguments',
      description: 'Input arguments for the structure run',
      required: true,
    }),
  },
  async run(context) {
    const { structure_id, input_args } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      args: input_args,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/structures/${structure_id}/runs`,
      requestBody
    );

    const structureRunId = response.structure_run_id;

    let runStatus = response.status;
    let runData = response;

    while (runStatus !== 'SUCCEEDED') {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      runData = await makeRequest(
        context.auth.secret_text,
        HttpMethod.GET,
        `/structure-runs/${structureRunId}`
      );

      runStatus = runData.status;
    }

    return runData;
  },
});
