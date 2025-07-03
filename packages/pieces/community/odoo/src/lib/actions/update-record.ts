import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from "../..";

export default createAction({
    name: 'update_record',
    auth: odooAuth,
    displayName: 'Custom Update Record',
    description: 'Update an existing record in the specified model',
    props: {
        model: Property.ShortText({
            displayName: 'Model',
            description: "Model name. e.g.: res.partner",
            required: true,
            defaultValue: 'res.partner',
        }),
        recordId: Property.Number({
            displayName: 'Record ID',
            description: 'ID of the record to update',
            required: true,
        }),
        fields: Property.Json({
            displayName: 'Fields and Values',
            description: 'JSON object of field names and their corresponding values',
            required: true,
            defaultValue: {
                "email": "updatedemail@example.com"
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
            const recordId = context.propsValue.recordId;
            const model = context.propsValue.model;
            const result = await odoo.updateRecord({ model, recordId, fields });
            return { success: result };
        } catch (err) {
            return err;
        }
    }
});
