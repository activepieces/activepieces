import { createAction, Property } from "@activepieces/pieces-framework";
import { delayUntil } from "../common";

export const delayUntilAction = createAction({
        name: 'delay_until',
        displayName: 'Delay Until',
        description: 'Delays the execution of the next action until a given timestamp',
        props: {
            delayUntilTimestamp: Property.DateTime({
                displayName: 'Date and Time',
                description: 'Specifies the date and time until which the execution of the next action should be delayed. It supports multiple formats, including ISO format.',
                required: true,
            }),
        },
        async run(context) {
            const delayTil = new Date(context.propsValue.delayUntilTimestamp);
			return await delayUntil(context, delayTil);
        },
});
