import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const removeFromWorkflowAction = createAction({
  auth: dripAuth,
  name: 'remove_from_workflow',
  displayName: 'Remove Subscriber From Workflow',
  description: 'Removes a subscriber from a workflow. Nothing happens if they are not on it.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a subscriber (by email or subscriber ID) from a Drip workflow by Workflow ID so it stops acting on them; nothing happens if they are not on it. Repeating it changes nothing more, so it is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    workflowId: Property.ShortText({ displayName: 'Workflow ID', description: 'Workflow ID (digits, from List Workflows).', required: true }),
    subscriber: dripProps.subscriber(),
  },
  outputSchema: dripOutputSchemas.workflowRemove,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const workflowId = dripApi.parseNumericId({ value: propsValue.workflowId, label: 'Workflow ID' });
    const subscriber = dripApi.requireText({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const segment = dripApi.seg({ value: subscriber, label: 'Subscriber Email or ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    await dripApi.request<unknown>({
      token,
      method: HttpMethod.DELETE,
      path: `${dripApi.accountPath(accountId)}/workflows/${workflowId}/subscribers/${segment}`,
      operation: 'remove subscriber from workflow',
    });
    return { workflowId, subscriber, removed: true };
  },
});
