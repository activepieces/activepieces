import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { subscriberFieldProps, subscriberInput } from '../common/subscriber-input';
import { dripOutputSchemas } from '../output-schemas';

export const startWorkflowAction = createAction({
  auth: dripAuth,
  name: 'start_workflow',
  displayName: 'Start Workflow for Subscriber',
  description: 'Starts a subscriber on an active workflow. The workflow may send emails.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a contact (by email or subscriber ID) on an active Drip workflow by Workflow ID (from List Workflows), creating or updating the subscriber with any fields given; the workflow may then send emails or apply tags. Drip ignores the request when the workflow is not active. Not idempotent: each call can start the subscriber on the workflow again.',
    idempotent: false,
  },
  props: {
    accountId: dripProps.accountId(),
    workflowId: Property.ShortText({ displayName: 'Workflow ID', description: 'Workflow ID (digits, from List Workflows). The workflow must be active.', required: true }),
    subscriber: dripProps.subscriber({ description: 'Email address of the person to start, or the Drip subscriber ID of an existing one.' }),
    ...subscriberFieldProps,
    customFields: dripProps.customFields(),
    tags: dripProps.tags(),
  },
  outputSchema: dripOutputSchemas.workflowStart,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const workflowId = dripApi.parseNumericId({ value: propsValue.workflowId, label: 'Workflow ID' });
    const record = { ...subscriberInput.fields(propsValue), ...dripApi.identify({ value: propsValue.subscriber, label: 'Subscriber Email or ID' }) };
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/workflows/${workflowId}/subscribers`,
      operation: 'start workflow',
      body: { subscribers: [record] },
    });
    const subscribers = dripApi.recordList({ body, key: 'subscribers' });
    return { workflowId, subscriber: subscribers[0] ?? null };
  },
});
