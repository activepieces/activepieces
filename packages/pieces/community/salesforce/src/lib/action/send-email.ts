import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi } from '../common';

export const sendEmail = createAction({
    auth: salesforceAuth,
    name: 'send_email',
    displayName: 'Send Email',
    description: 'Sends an email to a Contact or Lead.',
    props: {
        recipientId: Property.ShortText({
            displayName: 'Recipient ID',
            description: 'The ID of the Contact or Lead to send the email to.',
            required: true,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        body: Property.LongText({
            displayName: 'Body',
            description: 'The content of the email. Can be plain text or HTML.',
            required: true,
        }),
        log_email: Property.Checkbox({
            displayName: 'Log Email on Send',
            description: 'Check this to log the email activity on the recipient\'s record in Salesforce.',
            required: false,
        }),
    },
    async run(context) {
        const { recipientId, subject, body, log_email } = context.propsValue;

        const requestBody = {
            "inputs": [
                {
                    "emailSubject": subject,
                    "emailBody": body,
                    "recipientId": recipientId,
                    "logEmailOnSend": log_email || false,
                }
            ]
        };

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            `/services/data/v56.0/actions/standard/emailSimple`,
            requestBody
        );

        return response.body;
    },
});