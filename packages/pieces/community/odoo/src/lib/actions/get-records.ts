import { createAction, Property } from "@activepieces/pieces-framework";
import Odoo from "../../commom/index";
import { odooAuth } from "../..";
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export default createAction({
    name: 'get_records',
    auth: odooAuth,
    displayName: 'Custom Search and read records',
    description: 'Records can be listed and filtered',
    props: {
        // Properties to ask from the user, in this ask we will take number of
        model: Property.ShortText({
            displayName: 'Model',
            description: "Model name. e.g.: res.partner",
            required: true,
            defaultValue: 'res.partner',
        }),
        domain: Property.Json({
            displayName: 'Search domains',
            required: false,
            description: 'A domain is a list of criteria, each criterion being a triple of (field_name, operator, value). See https://www.odoo.com/documentation/17.0/developer/reference/backend/orm.html#reference-orm-domains for details.',
            defaultValue: [
                ["is_company", "=", true],
            ],
        }),
        fields: Property.Array({
            displayName: 'Fields',
            description: 'Returns the requested fields of the records. When undefined, returns all fields.',
            required: false,
          }),
        offset: Property.Number({
            displayName: 'Offset',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            required: false,
        })
    },
    async run(context) {
        await propsValidation.validateZod(context.propsValue, {
            limit: z.number().min(1).optional(),
        });

        const odoo = new Odoo({
            url: context.auth.base_url,
            port: 443,
            db: context.auth.database,
            username: context.auth.username,
            password: context.auth.api_key,
        })

        try {
            await odoo.connect();
            const domainArray = context.propsValue.domain
            ? (context.propsValue.domain as unknown as any[])
            : [];
            return await odoo.getRecords({model: context.propsValue.model, domain: domainArray, fields: context.propsValue.fields, offset: context.propsValue.offset, limit: context.propsValue.limit})
        } catch (err) {
            return err
        }
    }
});
