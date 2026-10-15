import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const getWorkflowAction = createAction({
  auth: dripAuth,
  name: 'get_workflow',
  displayName: 'Get Workflow',
  description: 'Gets one workflow by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Drip workflow by Workflow ID with its name, status (draft, active, paused) and creation date. Use to check a workflow is active before starting someone on it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    id: Property.ShortText({ displayName: 'Workflow ID', description: 'Workflow ID (digits, from List Workflows).', required: true }),
  },
  outputSchema: dripOutputSchemas.workflow,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const id = dripApi.parseNumericId({ value: propsValue.id, label: 'Workflow ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/workflows/${id}`,
      operation: 'get workflow',
    });
    return dripApi.firstRecord({ body, key: 'workflows', operation: 'get workflow' });
  },
});
