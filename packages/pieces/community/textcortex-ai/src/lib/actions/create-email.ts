import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createEmail = createAction({
    name: 'create_email',
    displayName: 'Create Email',
    description: 'Compose an email using context, recipient (“To”), and sender (“From”) metadata.',
    props: {
        mode: Property.StaticDropdown({
            displayName: 'Email Type',
            description: 'The style or type of email to generate.',
            required: true,
            options: {
                options: [
                    { label: 'General Email', value: 'general' },
                    { label: 'Reply to an Email', value: 'reply' },
                    { label: 'Cold Email', value: 'cold' },
                    { label: 'Customer Support Email', value: 'customer_support' },
                    { label: 'Email from Bullet Points', value: 'from_bullets' },
                ]
            }
        }),
        to: Property.ShortText({
            displayName: 'To',
            description: "The recipient of the email.",
            required: false,
        }),
        from: Property.ShortText({
            displayName: 'From',
            description: "The sender of the email.",
            required: false,
        }),
        context: Property.LongText({
            displayName: 'Context / Bullet Points',
            description: 'A summary, bullet points, or the main topic of the email.',
            required: true,
        }),
        // --- Fields for specific modes ---
        // ✅ FIXED: Removed validators and made these optional
        received_email: Property.LongText({
            displayName: 'Received Email (for Reply)',
            description: 'The full text of the email you are replying to. Use only when Email Type is "Reply to an Email".',
            required: false,
        }),
        instructions: Property.LongText({
            displayName: 'Reply Instructions',
            description: 'Specific instructions for how to formulate the reply. Use only when Email Type is "Reply to an Email".',
            required: false,
        }),
        purpose: Property.ShortText({
            displayName: 'Purpose (for Cold Email)',
            description: 'The primary goal or purpose of the cold email. Use only when Email Type is "Cold Email".',
            required: false,
        }),
        company_details: Property.LongText({
            displayName: 'Company Details (for Support)',
            description: 'Details about the company for the customer support response. Use only when Email Type is "Customer Support Email".',
            required: false,
        }),
        // --- Optional General Fields ---
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use for email generation.',
            required: false,
            options: {
                options: [
                    { label: "Gemini 2.0 Flash (Default)", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                ]
            }
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Higher values are more creative.',
            required: false,
        }),
    },
    async run(context) {
        const { ...payload } = context.propsValue;

        // Clean the payload to remove null/undefined values before sending
        Object.keys(payload).forEach(key => {
            if (payload[key as keyof typeof payload] === null || payload[key as keyof typeof payload] === undefined) {
                delete payload[key as keyof typeof payload];
            }
        });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/emails',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: payload,
        });

        return response.body;
    },
});