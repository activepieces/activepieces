import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, emptyToNull, makeClient } from "../../common";

export default createAction({
    name: 'update_customer',
    displayName: 'Update Customer',
    description: 'Updates a customer in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id: clockodoCommon.customer_id(true, undefined),
        name: Property.ShortText({
            displayName: 'Name',
            required: false
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
        color: clockodoCommon.color(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.updateCustomer(context.propsValue.customer_id as number, {
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