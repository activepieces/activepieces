import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const emailContactAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_email_contact',
  displayName: 'Email Contact',
  description: 'Sends an email to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends an email to a contact, optionally with its customer statement PDF attached. Get Contact Email Content returns the default recipients, subject and body to reuse; use Email Contact Statement to pick the statement period. Each call sends an email.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    toMailIds: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses, e.g. ["willsmith@bowmanfurniture.com"].',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Up to 1000 characters, e.g. "Welcome to Zillium Inc."',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body, HTML allowed, up to 5000 characters.',
      required: true,
    }),
    sendCustomerStatement: zohoBooksAiProps.flag({
      displayName: 'Send Customer Statement',
      description: 'Yes attaches the customer statement PDF.',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, toMailIds, subject, body, sendCustomerStatement } = context.propsValue;
    const toMailIdsList = zohoBooksUtils.toStringList({ value: toMailIds, propName: 'To' });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/email`,
      query: { organization_id: organizationId, send_customer_statement: sendCustomerStatement },
      body: { to_mail_ids: toMailIdsList, subject, body },
    });
  },
});
