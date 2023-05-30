import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, emptyToNull, makeClient } from "../../common";

export default createAction({
    name: 'create_customer',
    displayName: 'Create Customer',
    description: 'Creates a customer in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        name: Property.ShortText({
            displayName: 'Name',
            required: true
        }),
        number: Property.ShortText({
            displayName: 'Number',
            required: false
        }),
        active: Property.Checkbox({
            displayName: 'Active',
            required: false
        }),
        billable: Property.Checkbox({
            displayName: 'Billable',
            required: false
        }),
        note: Property.LongText({
            displayName: 'Note',
            required: false
        }),
        color: Property.Number({
            displayName: 'Color',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.createCustomer({
            name: context.propsValue.name,
            number: emptyToNull(context.propsValue.number),
            active: context.propsValue.active,
            billable_default: context.propsValue.billable,
            note: emptyToNull(context.propsValue.note),
            color: context.propsValue.color
        })
        return res.customer
    }
})