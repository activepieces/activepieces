import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const disableContactPaymentReminderAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_disable_contact_payment_reminder',
  displayName: 'Disable Contact Payment Reminder',
  description: 'Turns off automated payment reminders for a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns off automated payment reminders for a customer. Use Enable Contact Payment Reminder to turn them back on.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/paymentreminder/disable`,
      query: { organization_id: organizationId },
    });
  },
});
