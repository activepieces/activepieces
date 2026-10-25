import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const emailContactStatementAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_email_contact_statement',
  displayName: 'Email Contact Statement',
  description: 'Emails a statement of transactions to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails the account statement of a contact for a date range (the current month when no dates are given). Get Contact Statement Email Content returns the default recipients, subject and body to reuse. Each call sends an email.',
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
    ccMailIds: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to copy, e.g. ["peterparker@bowmanfurniture.com"].',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Up to 1000 characters, e.g. "Statement of transactions with Zillium Inc".',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body, HTML allowed, up to 5000 characters.',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description:
        'Statement start date, yyyy-mm-dd. Without both dates the current month is sent.',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Statement end date, yyyy-mm-dd.',
      required: false,
    }),
    sendFromOrgEmail: zohoBooksAiProps.flag({
      displayName: 'Send From Organization Email',
      description: "Yes sends the email from the organization's email address.",
      required: false,
    }),
  },
  async run(context) {
    const { contactId, toMailIds, ccMailIds, subject, body, startDate, endDate, sendFromOrgEmail } =
      context.propsValue;
    const toMailIdsList = zohoBooksUtils.toStringList({ value: toMailIds, propName: 'To' });
    const cc = ccMailIds ?? [];
    if (!cc.every((email): email is string => typeof email === 'string' && email !== '')) {
      throw new Error('CC must be a list of email addresses.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/statements/email`,
      query: { organization_id: organizationId, start_date: startDate, end_date: endDate },
      body: {
        to_mail_ids: toMailIdsList,
        ...(cc.length > 0 ? { cc_mail_ids: cc } : {}),
        subject,
        body,
        ...spreadIfDefined(
          'send_from_org_email_id',
          zohoBooksUtils.toBoolean({ value: sendFromOrgEmail }),
        ),
      },
    });
  },
});
