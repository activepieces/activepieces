import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from "../..";

export default createAction({
    name: 'create_company', // Must be a unique across the piece, this shouldn't be changed.
    auth: odooAuth,
    displayName: 'Create company',
    description: 'Create/Update company on Odoo',
    props: {
        // Properties to ask from the user, in this ask we will take number of
        name: Property.ShortText({
            displayName: 'Company Name',
            description: undefined,
            required: true,
        }),
        phone: Property.ShortText({
            displayName: 'Company Phone',
            description: undefined,
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Company E-mail',
            description: undefined,
            required: true,
        })
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
            const uid = await odoo.connect();
            console.log("Connected to Odoo server. Uid: ", uid);
            const c = await odoo.saveCompany({
                name: context.propsValue['name'],
                phone: context.propsValue['phone'],
                email: context.propsValue['email'],
            });
            return `Company ${c} created!`
        } catch (err) {
            return err;
        }
    },
});

