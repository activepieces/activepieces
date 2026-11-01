import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { suprsendAuth } from '../auth';
import { splitList, suprsendApiCall } from '../common/client';

export const triggerWorkflow = createAction({
  auth: suprsendAuth,
  name: 'trigger_workflow',
  classification: 'WRITE',
  displayName: 'Trigger Workflow',
  description: 'Send a notification to a user by triggering a SuprSend workflow.',
  audience: 'both',
  aiMetadata: {
    description:
      'Triggers a SuprSend notification workflow (by its slug) for one recipient, optionally passing template data, recipient emails or phone numbers, and a tenant. Use this to send notifications; use Create or Update User to save a user profile without sending anything. Each call starts a new workflow run, so retries send again.',
    idempotent: false,
  },
  props: {
    workflow: Property.ShortText({
      displayName: 'Workflow Slug',
      description:
        'In the SuprSend dashboard, open **Workflows**, click the workflow and copy its slug (for example `order-shipped`).',
      required: true,
    }),
    distinctId: Property.ShortText({
      displayName: 'User Distinct ID',
      description: 'The unique ID of the user in your system.',
      required: true,
    }),
    data: Property.Object({
      displayName: 'Data',
      description: 'Variables used in the workflow templates, for example `order_id`.',
      required: false,
    }),
    emails: Property.ShortText({
      displayName: 'Emails',
      description: 'Comma-separated email addresses of the recipient.',
      required: false,
    }),
    phones: Property.ShortText({
      displayName: 'Phone Numbers',
      description: 'Comma-separated phone numbers in international format, for example +14155550123.',
      required: false,
    }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'Send with this tenant\'s branding and preferences.',
      required: false,
    }),
  },
  async run(context) {
    const { workflow, distinctId, data, emails, phones, tenantId } = context.propsValue;

    const recipient: Record<string, unknown> = { distinct_id: distinctId };
    const emailList = splitList(emails);
    const phoneList = splitList(phones);
    if (emailList) recipient['$email'] = emailList;
    if (phoneList) recipient['$sms'] = phoneList;

    const body: Record<string, unknown> = { workflow, recipients: [recipient] };
    if (data && Object.keys(data).length > 0) body['data'] = data;
    if (tenantId) body['tenant_id'] = tenantId;

    return suprsendApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/trigger/',
      body,
    });
  },
});
