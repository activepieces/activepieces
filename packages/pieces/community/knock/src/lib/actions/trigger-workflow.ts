import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const triggerWorkflow = createAction({
  auth: knockAuth,
  name: 'trigger_workflow',
  displayName: 'Trigger Workflow',
  description: 'Trigger a Knock notification workflow for one or more recipients.',
  props: {
    workflowKey: Property.ShortText({
      displayName: 'Workflow Key',
      description: 'The key of the workflow to trigger (e.g. "new-comment").',
      required: true,
    }),
    recipients: Property.Array({
      displayName: 'Recipient IDs',
      description: 'One or more user IDs to receive the notification.',
      required: true,
    }),
    actorId: Property.ShortText({
      displayName: 'Actor ID',
      description: 'The user ID of the person performing the action (optional).',
      required: false,
    }),
    data: Property.Object({
      displayName: 'Data',
      description: 'Key-value data passed to the workflow template (optional).',
      required: false,
    }),
    tenant: Property.ShortText({
      displayName: 'Tenant',
      description: 'Optional tenant identifier for multi-tenant workflows.',
      required: false,
    }),
  },
  async run(context) {
    const { workflowKey, recipients, actorId, data, tenant } =
      context.propsValue;

    const body: Record<string, unknown> = {
      recipients,
    };

    if (actorId) {
      body['actor'] = actorId;
    }
    if (data && Object.keys(data).length > 0) {
      body['data'] = data;
    }
    if (tenant) {
      body['tenant'] = tenant;
    }

    return knockApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/workflows/${encodeURIComponent(workflowKey)}/trigger`,
      body,
    });
  },
});
