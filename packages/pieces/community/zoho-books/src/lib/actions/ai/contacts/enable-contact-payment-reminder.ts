import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const enableContactPaymentReminderAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_enable_contact_payment_reminder',
  displayName: 'Enable Contact Payment Reminder',
  description: 'Turns on automated payment reminders for a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns on automated payment reminders for a customer. Use Disable Contact Payment Reminder to turn them off.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/paymentreminder/enable`,
      query: { organization_id: organizationId },
    });
  },
});
