import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, emptyToNull, makeClient } from "../../common";

export default createAction({
    name: 'create_service',
    displayName: 'Create Service',
    description: 'Creates a service in clockodo',
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
        note: Property.LongText({
            displayName: 'Note',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.createService({
            name: context.propsValue.name,
            number: emptyToNull(context.propsValue.number),
            active: context.propsValue.active,
            note: emptyToNull(context.propsValue.note)
        })
        return res.service
    }
})