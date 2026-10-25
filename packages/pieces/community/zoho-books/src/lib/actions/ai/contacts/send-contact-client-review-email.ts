import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const sendContactClientReviewEmailAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_send_contact_client_review_email',
  displayName: 'Send Contact Client Review Email',
  description: 'Sends the client review email to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails a contact the client review request. Each call sends another email. Get Contact Client Review Email Content gives the default recipients, subject and body.',
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
    const { contactId, toMailIds, ccMailIds, subject, body, sendFromOrgEmailId, additionalFields } =
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
      path: `/contacts/${encodeURIComponent(contactId)}/clientreviews/email`,
      query: { organization_id: organizationId },
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
