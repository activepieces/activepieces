import { Property, createAction } from '@activepieces/pieces-framework';

export const echoMessage = createAction({
    name: 'echo_message',
    displayName: 'Echo Message',
    description: 'Echoes a message back',
    props: {
        message: Property.ShortText({
            displayName: 'Message',
            description: 'The message to echo',
            required: true,
        }),
    },
    async run(context) {
        const message = context.propsValue.message;
        return { message: message };
    },
});