import MailerLite from "@mailerlite/mailerlite-nodejs";
import { createAction, Property } from "@activepieces/framework";

export const createOrUpdateSubscriber = createAction({
    name: 'add_or_update_subscriber',
    displayName: "Add or Update subscriber",
    description: "Create or update a existing subscription",
    props: {
        api_key: Property.ShortText({
            description: "Paste your api key",
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
    sampleData: {},
    async run(context) {
        const api_key = context.propsValue.api_key;
        const mailerLite = new MailerLite({ api_key });

        const params : MailerLiteParams = {
            email: context.propsValue.email,
        };

        if(context.propsValue.name) params.fields = { name: context.propsValue.name };

        try{
            const response = await mailerLite.subscribers.createOrUpdate(params);
            return response.data;
        } catch(err){
            return err
        }
    },
});


type MailerLiteParams = {
    email: string;
    fields?:{
        name: string;
    }

}