import MailerLite from "@mailerlite/mailerlite-nodejs";
import { createAction, Property } from "@activepieces/framework";

const markdownDescription = `
To obtain your API key, follow these steps:

1. Log in to your MailerLite account.
2. Visit the [API page](https://dashboard.mailerlite.com/integrations/api).
3. Click the **Generate new token** button.
4. Copy the generated API key.
`

export const createOrUpdateSubscriber = createAction({
    name: 'add_or_update_subscriber',
    displayName: "Add or Update subscriber",
    description: "Create or update a existing subscription",
    props: {
        api_key: Property.SecretText({
            description: markdownDescription,
            displayName: 'Authentication',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email of the new contact',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'Name of the new contact',
            required: false,
        }),

    },
    sampleData: {
        "id": "84110545825826021",
        "email": "mo@activepieces.com",
        "status": "active",
        "source": "api",
        "sent": 0,
        "opens_count": 0,
        "clicks_count": 0,
        "open_rate": 0,
        "click_rate": 0,
        "ip_address": null,
        "subscribed_at": "2023-03-30 22:07:47",
        "unsubscribed_at": null,
        "created_at": "2023-03-30 22:07:47",
        "updated_at": "2023-03-30 22:07:47",
        "fields": {
            "name": null,
            "last_name": null,
            "company": null,
            "country": null,
            "city": null,
            "phone": null,
            "state": null,
            "z_i_p": null
        },
        "groups": [],
        "location": null,
        "opted_in_at": null,
        "optin_ip": null
    },
    async run(context) {
        const api_key = context.propsValue.api_key;
        const mailerLite = new MailerLite({ api_key });

        const params: MailerLiteParams = {
            email: context.propsValue.email,
        };

        if (context.propsValue.name) params.fields = { name: context.propsValue.name };

        const response = await mailerLite.subscribers.createOrUpdate(params);
        return response.data.data;

    },
});


type MailerLiteParams = {
    email: string;
    fields?: {
        name: string;
    }

}