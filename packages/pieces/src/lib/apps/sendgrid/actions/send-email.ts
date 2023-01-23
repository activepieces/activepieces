import {createAction} from "../../../framework/action/action";
import {Property} from "../../../framework/property";
import { httpClient } from '../../../common/http/core/http-client';
import { HttpRequest } from '../../../common/http/core/http-request';
import { HttpMethod } from '../../../common/http/core/http-method';
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import {sendgridCommon} from "../common";

export const sendEmail = createAction({
    name: 'send_email',
    displayName: "Send Email",
    description: "Send a text or HTML email",
    props: {
        authentication: sendgridCommon.authentication,
        to: Property.ShortText({
            displayName: 'To',
            description: 'Emails of the recipients, separated by commas (,)',
            required: true,
        }),
        from: Property.ShortText({
            displayName: 'From (Email)',
            description: 'Sender email, must be on your SendGrid',
            required: true,
        }),
        from_name: Property.ShortText({
            displayName: 'From (Name)',
            description: 'Sender name',
            required: false,
        }),
        reply_to: Property.ShortText({
            displayName: 'Reply To',
            description: 'Email to receive replies on (defaults to sender)',
            required: false,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            description: undefined,
            required: true,
        }),
        content_type: Property.Dropdown<'text' | 'html'>({
            displayName: "Content Type",
            refreshers: [],
            required: true,
            options: async () => {
                return {
                    disabled: false,
                    options:
                    [
                        { label: 'Plain Text', value: 'text' },
                        { label: 'HTML', value: 'html' },
                    ]
                } ;
            }
        }),
        content: Property.ShortText({
            displayName: 'Content',
            description: 'HTML is only allowed if you selected HTML as type',
            required: true,
        }),
    },
    async run(context) {
        const configsWithoutAuthentication = {...context.propsValue};
        delete configsWithoutAuthentication['authentication'];

        const message = {
          personalizations: (configsWithoutAuthentication.to as string).split(',').map(x => {
                    return {
                        to: [{
                            email: x.trim()
                        }]
                    }
                }),
          from: {
            email: configsWithoutAuthentication.from,
            name: configsWithoutAuthentication.from_name
          },
          reply_to: {
            email: configsWithoutAuthentication.reply_to
          },
          subject: configsWithoutAuthentication.subject,
          content: [
            {
              type: configsWithoutAuthentication.content_type == 'text' ? 'text/plain' : 'text/html',
              value: configsWithoutAuthentication.content
            }
          ],
        };

        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${sendgridCommon.baseUrl}/mail/send`,
            body: message,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue.authentication!,
            },
            queryParams: {},
        };
        await httpClient.sendRequest(request);

        return {
            success: true
        };
    },
    sampleData: {
        success: true
    }
});
