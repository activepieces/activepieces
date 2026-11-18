import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi ,salesforcesCommon } from '../common';
import { sobjectCreateResponseOutputSchema } from '../output-schemas';

export const sendEmail = createAction({
    auth: salesforceAuth,
    name: 'send_email',
    classification: 'WRITE',
    displayName: 'Log Email',
    description: 'Records an email on a contact or lead. Salesforce does not send it.',
    audience: 'human',
    aiMetadata: { description: 'Send an email to a Contact or Lead (body may be plain text or HTML) and log it as an EmailMessage, optionally related to another record. Not idempotent — each call sends and records another email.', idempotent: false },
    outputSchema: sobjectCreateResponseOutputSchema,
    propertyGroups: [
        { key: 'recipient', display: 'section', label: 'Recipient', icon: 'send', props: ['delivery_warning', 'recipientId', 'relatedToId'] },
        { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['subject', 'body'] },
    ],
    props: {
        delivery_warning: Property.MarkDown({
            value: 'Salesforce saves this email as sent but does not deliver it. Use an email piece to send mail.',
            variant: MarkdownVariant.WARNING,
        }),
        recipientId: salesforcesCommon.recipient,
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
            placeholder: 'Following up on our call',
        }),
        body: Property.LongText({
            displayName: 'Body',
            description: 'Plain text or HTML.',
            required: true,
        }),
        relatedToId: Property.ShortText({
            displayName: 'Related Record ID',
            description: 'Account, case or other record ID, from its URL or an earlier step.',
            required: false,
            placeholder: '0015g00000XyZ12AAB',
        })
    },
    async run(context) {
        const { recipientId, subject, body, relatedToId } = context.propsValue;

        const emailMessage = {
            ToIds: [recipientId],
            Subject: subject,
            HtmlBody: body,
            Status: '3',
            ...(relatedToId && { RelatedToId: relatedToId }),
        };

        const cleanedBody = Object.entries(emailMessage).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            `/services/data/v56.0/sobjects/EmailMessage`,
            cleanedBody
        );

        return response.body;
    },
});