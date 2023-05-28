import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, emptyToNull, makeClient } from "../../common";

export default createAction({
    name: 'update_service',
    displayName: 'Update Service',
    description: 'Updates a service in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        service_id: Property.Number({
            displayName: 'Service ID',
            required: true
        }),
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
        note: Property.LongText({
            displayName: 'Note',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.updateService(context.propsValue.service_id, {
            name: context.propsValue.name,
            number: emptyToNull(context.propsValue.number),
            active: context.propsValue.active,
            note: emptyToNull(context.propsValue.note)
        })
        return res.service
    }
})