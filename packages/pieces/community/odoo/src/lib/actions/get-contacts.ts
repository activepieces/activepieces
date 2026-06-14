import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from '../auth';

export default createAction({
    name: 'get_contacts', // Must be a unique across the piece, this shouldn't be changed.
    auth: odooAuth,
    displayName: 'Get contacts',
    description: 'Get contacts on Odoo',
    audience: 'both',
    aiMetadata: { description: 'Reads contacts (res.partner records) from Odoo, scoped by a required type flag that selects either individual contacts or companies. Operates in two modes: leave the name blank to fetch all matching records, or supply a name to filter to partners whose name matches it. Read-only and idempotent. Use to look up or list Odoo contacts/companies before acting on them.', idempotent: true },
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
            url: context.auth.props.base_url,
            port: 443,
            db: context.auth.props.database,
            username: context.auth.props.username,
            password: context.auth.props.api_key,
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

