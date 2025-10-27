import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi ,salesforcesCommon } from '../common';

export const sendEmail = createAction({
    auth: salesforceAuth,
    name: 'send_email',
    displayName: 'Send Email',
    description: 'Sends an email to a Contact or Lead by creating an EmailMessage record.',
    props: {
        recipientId: salesforcesCommon.recipient,
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        body: Property.LongText({
            displayName: 'Body',
            description: 'The content of the email. Can be plain text or HTML.',
            required: true,
        }),
        relatedToId: Property.ShortText({
            displayName: 'Related To ID (Optional)',
            description: 'The ID of a record to relate the email to (e.g., an Account, Opportunity, or Case ID).',
            required: false,
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