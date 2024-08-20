import { Property, createAction } from "@activepieces/pieces-framework";

export const response = createAction({
    name: 'returnResponse',
    displayName: 'Return Response',
    description: 'Return response to the original flow', 
    props: {
        response: Property.Json({
            displayName: 'Response',
            required: true,
        }),
    },
    async run(context) {
        context.run.stop({
            response: context.propsValue.response,
        });
        return context.propsValue.response;
    },
})