import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from "../..";

export default createAction({
    name: 'get_contacts', // Must be a unique across the piece, this shouldn't be changed.
    auth: odooAuth,
    displayName: 'Get contacts',
    description: 'Get contacts on Odoo',
    props: {
        // Properties to ask from the user, in this ask we will take number of
        type: Property.StaticDropdown({
            displayName: 'Type',
            description: "Select which contact type to get",
            required: true,
            options: {
                options: [
                    {
                        label: "Contact",
                        value: false,
                    },
                    {
                        label: "Company",
                        value: true,
                    },
                ],
            }
        }),
        name: Property.ShortText({
            displayName: 'Contact Name',
            description: "Would you like to search any specific name?",
            required: false,
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

            if (context.propsValue['name'])
                return await odoo.getContact({ name: context.propsValue['name'], isCompany: context.propsValue['type'] })
            else
                return await odoo.getAllContacts({ isCompany: context.propsValue['type'] })
        } catch (err) {
            return err
        }
    }
});

