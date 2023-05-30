import { Property, createAction, } from "@activepieces/pieces-framework";

export const stopAction = createAction({
    name: 'stop',
    displayName: 'Stop',
    description: 'stop execution',
    props: {
        response: Property.Json({
            displayName: 'response',
            description: 'Response to return when stopping execution',
            required: true,
        }),
    },
    async run(ctx) {
        const { response } = ctx.propsValue

        ctx.run.stop({
            response,
        })

        return {
            response,
            success: true,
        };
    },
});
