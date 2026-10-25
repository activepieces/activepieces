import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const sendContactVendorStatementEmailAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_send_contact_vendor_statement_email',
  displayName: 'Send Contact Vendor Statement Email',
  description: 'Emails a statement of account to a Zoho Books vendor.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails the statement of account for a date range to a vendor. Each call sends another email. Get Contact Vendor Statement Email Content gives the default recipients, subject and body. For customers use Email Contact Statement.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({
      required: true,
      displayName: 'Vendor ID',
      description: 'Contact ID of a vendor, from List Contacts or Create Contact.',
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description:
        'Statement start date, yyyy-mm-dd. Leave Start Date and End Date empty for the current month.',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Statement end date, yyyy-mm-dd.',
      required: false,
    }),
    toMailIds: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses, e.g. ["accounts@vendor.com"].',
      required: true,
    }),
    ccMailIds: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to copy.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Up to 1000 characters.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body; HTML is allowed. Up to 5000 characters.',
      required: false,
    }),
    sendFromOrgEmailId: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Send From Organization Email',
      description: "Yes sends from the organization's email address instead of the user's.",
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description: 'Other email fields. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      contactId,
      startDate,
      endDate,
      toMailIds,
      ccMailIds,
      subject,
      body,
      sendFromOrgEmailId,
      additionalFields,
    } = context.propsValue;
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
      path: `/contacts/${encodeURIComponent(contactId)}/vendorstatements/email`,
      query: { organization_id: organizationId, start_date: startDate, end_date: endDate },
      body: {
        ...additionalFields,
        to_mail_ids: toMailIdsList,
        ...(cc.length > 0 ? { cc_mail_ids: cc } : {}),
        ...spreadIfDefined('subject', subject),
        ...spreadIfDefined('body', body),
        ...spreadIfDefined(
          'send_from_org_email_id',
          zohoBooksUtils.toBoolean({ value: sendFromOrgEmailId }),
        ),
      },
    });
  },
});
