import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from "../..";

export default createAction({
    name: 'create_record',
    auth: odooAuth,
    displayName: 'Custom Create Record',
    description: 'Create a new record in the specified model',
    props: {
        model: Property.ShortText({
            displayName: 'Model',
            description: "Model name. e.g.: res.partner",
            required: true,
            defaultValue: 'res.partner',
        }),
        fields: Property.Json({
            displayName: 'Fields and Values',
            description: 'JSON object of field names and their corresponding values',
            required: true,
            defaultValue: {
                "name": "New Partner",
                "email": "newpartner@example.com"
            },
        })
    },
    async run(context) {
        const odoo = new Odoo({
            url: context.auth.base_url,
            port: 443,
            db: context.auth.database,
            username: context.auth.username,
            password: context.auth.api_key,
        });

        try {
            await odoo.connect();
            const fields = context.propsValue.fields;
            const model = context.propsValue.model;
            const recordId = await odoo.createRecord({ model, fields });
            return { id: recordId };
        } catch (err) {
            return err;
        }
    }
});

