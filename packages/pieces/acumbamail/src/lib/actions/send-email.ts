import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { acumbamailCommon } from "../common";
import { acumbamailAuth } from "../..";

export const sendEmail = createAction({
    auth: acumbamailAuth,
    name: 'send_email',
    displayName: "Send Email",
    description: "Send a text or HTML email",
    props: {
        to_email: Property.Array({
            displayName: 'To',
            description: 'Emails of the recipients',
            required: true,
        }),
        cc_email: Property.Array({
            displayName: 'CC',
            description: 'Emails of the recipients in copy',
            required: false,
        }),
        bcc_email: Property.Array({
            displayName: 'BCC',
            description: 'Emails of the recipients in blind copy',
            required: false,    

        }),
        from_email: Property.ShortText({
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
        body: Property.Dropdown<'text' | 'html'>({
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
                };
            }
        }),
        content: Property.ShortText({
            displayName: 'Content',
            description: 'HTML is only allowed if you selected HTML as type',
            required: true,
        }),
        template_id: Property.ShortText({
            displayName: 'Template ID',
            description: 'ID of the template to send',
            required: false,
        }),
        merge_tags: Property.Object({
            displayName: 'Merge Tags',
            description: 'JSON string of merge tags if template_id is used',
            required: false,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'Email category',
            required: false,
        }),
        program_date: Property.DateTime({
            displayName: 'Program Date',
            description: 'Date on which the email will be sent. Format: YYYY-MM-DD HH:MM',
            required: false,
        }),
    },
    async run(context) {
        const { to_email, cc_email, bcc_email, from_email, from_name, reply_to, subject, body, content, template_id, merge_tags, category, program_date } = context.propsValue;

        // Access the auth token from context
        const authToken = context.auth; // Replace with the correct context field if different

        // Constructing URL with parameters
        const urlParams = new URLSearchParams({
            'auth_token': authToken,
            'to_email': to_email.join(','),
            'from_email': from_email,
            'from_name': from_name || '',
            'cc_email': cc_email ? cc_email.join(',') : '',
            'bcc_email': bcc_email ? bcc_email.join(',') : '',
            'template_id': template_id || '',
            'reply_to': reply_to || from_email,
            'subject': subject,
            'body': content,
            'content_type': body === 'text' ? 'text/plain' : 'text/html',
            'category': category || '',
            'program_date': program_date ? program_date.toString() : ''
        });

        // Safely adding merge tags to the URL parameters
        if (merge_tags && typeof merge_tags === 'object') {
            for (const key in merge_tags) {
                if (Object.prototype.hasOwnProperty.call(merge_tags, key)) {
                    const value = merge_tags[key];
                    urlParams.append(`dict[${key}]`, String(value)); // Convert value to string
                }
            }
        }

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${acumbamailCommon.baseUrl}/sendOne/?${urlParams.toString()}`,
        };

        await httpClient.sendRequest(request);

        return {
            success: true
        };
    },
});