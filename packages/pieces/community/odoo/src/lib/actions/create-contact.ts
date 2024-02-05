import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from "../..";

export default createAction({
    name: 'create_contact', // Must be a unique across the piece, this shouldn't be changed.
    auth: odooAuth,
    displayName: 'Create contact',
    description: 'Create/Update contact on Odoo',
    props: {
        // Properties to ask from the user, in this ask we will take number of
        name: Property.ShortText({
            displayName: 'Contact Name',
            description: undefined,
            required: true,
        }),
        phone: Property.ShortText({
            displayName: 'Contact Phone',
            description: undefined,
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Contact E-mail',
            description: undefined,
            required: true,
        }),
        company: Property.ShortText({
            displayName: 'Company Name',
            description: undefined,
            required: true,
        }),
        title: Property.ShortText({
            displayName: 'Job Title',
            description: undefined,
            required: true,
        }),
    },
    async run(context) {
        const odoo = new Odoo({
            url: context.auth.base_url,
            port: 443,
            db: context.auth.database,
            username: context.auth.username,
            password: context.auth.api_key,
        })

        try {
            await odoo.connect();
            const c = await odoo.saveContact({
                name: context.propsValue['name'],
                phone: context.propsValue['name'],
                email: context.propsValue['name'],
                company: context.propsValue['company'],
                title: context.propsValue['title']
            });
            return `Contact ${c} created!`
        } catch (err) {
            return err
        }
    }
});

