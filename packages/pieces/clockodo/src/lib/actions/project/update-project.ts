import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, emptyToNull, makeClient } from "../../common";

export default createAction({
    name: 'update_project',
    displayName: 'Update Project',
    description: 'Updates a project in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        project_id: clockodoCommon.project_id(true, false, undefined),
        customer_id: clockodoCommon.customer_id(false),
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
        budget: Property.Number({
            displayName: 'Budget',
            required: false
        }),
        budget_is_hours: Property.Checkbox({
            displayName: 'Budget in hours?',
            required: false
        }),
        budget_is_not_strict: Property.Checkbox({
            displayName: 'Soft Budget',
            required: false
        }),
        note: Property.LongText({
            displayName: 'Note',
            required: false
        }),
        completed: Property.Checkbox({
            displayName: 'Completed',
            required: false
        }),
        billed_amount: Property.Number({
            displayName: 'Billed Amount',
            required: false
        }),
        billing_complete: Property.Checkbox({
            displayName: 'Billing Complete',
            required: false
        }),
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.updateProject(context.propsValue.project_id as number, {
            name: context.propsValue.name,
            customers_id: context.propsValue.customer_id,
            number: emptyToNull(context.propsValue.number),
            active: context.propsValue.active,
            billable_default: context.propsValue.billable,
            note: emptyToNull(context.propsValue.note),
            budget_money: context.propsValue.budget,
            budget_is_hours: context.propsValue.budget_is_hours,
            budget_is_not_strict: context.propsValue.budget_is_not_strict,
            completed: context.propsValue.completed,
            billed_money: context.propsValue.billed_amount,
            billed_completely: context.propsValue.billing_complete
        })
        return res.project
    }
})