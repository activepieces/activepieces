import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';

export const retryEmailAction = createAction({
  auth: emailitAuth,
  name: 'retry_email',
  displayName: 'Retry Email',
  description: 'Send a bounced, failed, suppressed or held email again as a new email.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Queues a new copy (new ID, same content and recipient) of an Emailit email whose status is bounced, failed, suppressed or held, created in the last 30 days. Costs a credit like a new send. Not idempotent: each call sends another copy. Fix the cause first, e.g. remove the suppression.',
    idempotent: false,
  },
  outputSchema: emailitSchemas.retried,
  props: {
    email_id: emailitProps.emailId({ description: 'ID of the bounced, failed, suppressed or held email.' }),
  },
  async run({ auth, propsValue }) {
    try {
      return await emailitClient.request({
        auth,
        method: HttpMethod.POST,
        path: `/emails/${emailitClient.seg({ value: propsValue.email_id, label: 'Email ID' })}/retry`,
      });
    } catch (error) {
      return emailitClient.rethrowWithHint({
        error,
        hints: { 404: 'Email not found.', 422: 'This email cannot be retried (status not bounced/failed/suppressed/held, older than 30 days, or content purged).' },
      });
    }
  },
});
